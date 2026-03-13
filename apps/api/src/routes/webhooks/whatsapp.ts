import { Router, Request, Response } from 'express';
import { env } from '../../config/env';
import { processMessage } from '../../ai/agent';
import { sendWhatsAppMessage, markAsRead } from '../../integrations/whatsapp';

const router = Router();

// Set to track processed message IDs (prevents duplicate processing)
const processedMessages = new Set<string>();

/**
 * GET /api/v1/webhooks/whatsapp/verify
 * WhatsApp webhook verification (Meta requires this during setup).
 */
router.get('/verify', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.whatsappVerifyToken) {
    console.log('[WhatsApp] Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp] Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * POST /api/v1/webhooks/whatsapp
 * Receives incoming WhatsApp messages from Meta Cloud API.
 * Processes them through the AI agent and sends a reply.
 */
router.post('/', async (req: Request, res: Response) => {
  // Always respond 200 immediately (Meta requires fast acknowledgment)
  res.sendStatus(200);

  try {
    const body = req.body;

    // Validate webhook structure
    if (!body.object || body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = body.entry;
    if (!entries || entries.length === 0) return;

    for (const entry of entries) {
      const changes = entry.changes;
      if (!changes || changes.length === 0) continue;

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const messages = change.value?.messages;
        if (!messages || messages.length === 0) continue;

        for (const message of messages) {
          // Skip if already processed (idempotency)
          if (processedMessages.has(message.id)) continue;
          processedMessages.add(message.id);

          // Clean up old message IDs (keep last 1000)
          if (processedMessages.size > 1000) {
            const first = processedMessages.values().next().value;
            if (first) processedMessages.delete(first);
          }

          // Only handle text messages for now
          if (message.type !== 'text') {
            const phone = message.from;
            await sendWhatsAppMessage(
              phone,
              'عذراً، أقدر أتعامل مع الرسائل النصية فقط حالياً. اكتب طلبك وأنا بساعدك! 😊'
            );
            continue;
          }

          const customerPhone = message.from; // E.164 without +
          const messageText = message.text.body;

          console.log(`[WhatsApp] Message from ${customerPhone}: ${messageText}`);

          // Mark as read (blue ticks)
          markAsRead(message.id);

          // Process through AI agent
          const response = await processMessage(`+${customerPhone}`, messageText);

          console.log(`[WhatsApp] Reply to ${customerPhone}: ${response.reply}`);
          console.log(`[WhatsApp] Tools called: ${response.toolsCalled.join(', ') || 'none'}`);

          // Send reply back via WhatsApp
          await sendWhatsAppMessage(customerPhone, response.reply);
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp] Error processing message:', error);
  }
});

export default router;
