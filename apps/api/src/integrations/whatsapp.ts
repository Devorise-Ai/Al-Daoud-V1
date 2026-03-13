import { env } from '../config/env';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Send a text message to a customer via WhatsApp Business API.
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<any> {
  const url = `${WHATSAPP_API_URL}/${env.whatsappPhoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('WhatsApp API error:', error);
    throw new Error(`WhatsApp API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Send a booking confirmation template message with details.
 * Template must be pre-approved by Meta.
 */
export async function sendBookingConfirmation(
  to: string,
  details: {
    courtName: string;
    date: string;
    time: string;
    price: string;
    mapsLink: string;
    cancelLink: string;
  }
): Promise<any> {
  const message = details.courtName.match(/[\u0600-\u06FF]/)
    ? `✅ تم تأكيد حجزك!

📍 الملعب: ${details.courtName}
📅 التاريخ: ${details.date}
⏰ الوقت: ${details.time}
💰 السعر: ${details.price} دينار

📍 الموقع: ${details.mapsLink}

لإلغاء أو تعديل الحجز:
${details.cancelLink}`
    : `✅ Booking Confirmed!

📍 Court: ${details.courtName}
📅 Date: ${details.date}
⏰ Time: ${details.time}
💰 Price: ${details.price} JOD

📍 Location: ${details.mapsLink}

To cancel or modify:
${details.cancelLink}`;

  return sendWhatsAppMessage(to, message);
}

/**
 * Mark a message as read (sends blue ticks).
 */
export async function markAsRead(messageId: string): Promise<void> {
  const url = `${WHATSAPP_API_URL}/${env.whatsappPhoneNumberId}/messages`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  }).catch(() => {}); // Non-critical, don't throw
}
