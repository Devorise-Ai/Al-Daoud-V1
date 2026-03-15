import { Router, Request, Response } from 'express';
import { processMessage } from '../ai/agent';

const router = Router();

/**
 * POST /api/v1/ai/test
 * Test the AI agent without WhatsApp.
 * Send a message, get the AI's response.
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { message, phone } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const customerPhone = phone || '+962791000001'; // Default to first mock customer

    console.log(`[AI Test] Message from ${customerPhone}: ${message}`);

    const response = await processMessage(customerPhone, message);

    console.log(`[AI Test] Reply: ${response.reply}`);
    console.log(`[AI Test] Tools called: ${response.toolsCalled.join(', ') || 'none'}`);

    res.json({
      reply: response.reply,
      tools_called: response.toolsCalled,
      conversation_id: response.conversationId,
      language: response.lang,
    });
  } catch (error: any) {
    console.error('[AI Test] Error:', error);
    res.status(500).json({
      error: 'AI agent failed',
      details: error.message,
    });
  }
});

/**
 * GET /api/v1/ai/test
 * Simple page to test the AI agent in the browser.
 */
router.get('/test', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Al Daoud AI Agent Test</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 16px 24px; background: #111; border-bottom: 1px solid #222; }
    .header h1 { font-size: 18px; color: #10b981; }
    .header p { font-size: 13px; color: #666; margin-top: 4px; }
    .chat { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 70%; padding: 12px 16px; border-radius: 12px; font-size: 15px; line-height: 1.5; }
    .msg.user { background: #10b981; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .msg.ai { background: #1a1a1a; color: #e5e5e5; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #222; }
    .msg.system { background: #1a1a0a; color: #f59e0b; align-self: center; font-size: 12px; border: 1px solid #f59e0b33; font-family: monospace; }
    .tools { font-size: 11px; color: #666; margin-top: 6px; }
    .tools span { background: #222; padding: 2px 8px; border-radius: 4px; margin: 0 2px; }
    .input-area { padding: 16px 24px; background: #111; border-top: 1px solid #222; display: flex; gap: 12px; }
    input { flex: 1; background: #1a1a1a; border: 1px solid #222; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 15px; outline: none; }
    input:focus { border-color: #10b981; }
    button { background: #10b981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; cursor: pointer; }
    button:hover { background: #059669; }
    button:disabled { background: #333; cursor: not-allowed; }
    .typing { color: #666; font-size: 13px; padding: 8px 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Al Daoud AI Agent Test</h1>
    <p>Test the booking AI without WhatsApp. Type in Arabic or English.</p>
  </div>
  <div class="chat" id="chat"></div>
  <div class="input-area">
    <input type="text" id="input" placeholder="اكتب رسالتك هنا..." autofocus />
    <button id="send" onclick="sendMessage()">Send</button>
  </div>
  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !sendBtn.disabled) sendMessage();
    });

    async function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;

      addMessage(msg, 'user');
      input.value = '';
      sendBtn.disabled = true;

      const typing = document.createElement('div');
      typing.className = 'typing';
      typing.textContent = 'AI is thinking...';
      chat.appendChild(typing);
      chat.scrollTop = chat.scrollHeight;

      try {
        const res = await fetch('/api/v1/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, phone: '+962791000001' })
        });
        const data = await res.json();
        typing.remove();

        if (data.error) {
          addMessage('Error: ' + (data.details || data.error), 'system');
        } else {
          if (data.tools_called && data.tools_called.length > 0) {
            addMessage('Tools: ' + data.tools_called.join(', '), 'system');
          }
          addMessage(data.reply, 'ai');
        }
      } catch (err) {
        typing.remove();
        addMessage('Connection error: ' + err.message, 'system');
      }

      sendBtn.disabled = false;
      input.focus();
    }

    function addMessage(text, type) {
      const div = document.createElement('div');
      div.className = 'msg ' + type;
      div.textContent = text;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    addMessage('Welcome! Type a message to test the AI agent. Try: "بدي احجز ملعب يوم الجمعة الساعة 6"', 'system');
  </script>
</body>
</html>
  `);
});

export default router;
