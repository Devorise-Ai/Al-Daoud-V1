import { env } from '../config/env';
import {
  sendBookingConfirmation as sendWhatsAppConfirmation,
  sendWhatsAppMessage,
} from '../integrations/whatsapp';
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from '../integrations/google-calendar';
import type { Booking, Customer, Court } from '../../../../packages/shared/src/types';

const FRONTEND_URL = env.frontendUrl;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO datetime to a human-readable Arabic-friendly date string. */
function formatDateAr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-JO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format an ISO datetime to a human-readable time string (Arabic locale). */
function formatTimeAr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-JO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Format date in English. */
function formatDateEn(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format time in English. */
function formatTimeEn(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Notification functions
// ---------------------------------------------------------------------------

/**
 * Send a booking confirmation: creates a Google Calendar event and sends
 * a WhatsApp confirmation message to the customer.
 *
 * Returns the Google Calendar event ID (or null).
 */
export async function sendBookingConfirmation(
  booking: Booking & { court?: Court },
  customer: Customer
): Promise<{ googleEventId: string | null }> {
  let googleEventId: string | null = null;

  // 1. Create Google Calendar event
  try {
    if (booking.court?.google_cal_id) {
      googleEventId = await createCalendarEvent({
        court_google_cal_id: booking.court.google_cal_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        customer_name: customer.name || customer.phone,
        booking_type: booking.booking_type,
        booking_id: booking.id,
      });
    }
  } catch (error) {
    console.error(
      '[Notification] Failed to create Google Calendar event:',
      error
    );
  }

  // 2. Send WhatsApp confirmation
  try {
    const cancelLink = `${FRONTEND_URL}/booking/${booking.cancel_token}`;
    const mapsLink = booking.court?.maps_link || 'https://maps.app.goo.gl/abdoun-amman';

    const isArabic = customer.preferred_lang === 'ar';
    const courtName = isArabic
      ? booking.court?.name_ar || booking.court?.name || 'Court'
      : booking.court?.name || 'Court';
    const date = isArabic
      ? formatDateAr(booking.start_time)
      : formatDateEn(booking.start_time);
    const time = isArabic
      ? `${formatTimeAr(booking.start_time)} - ${formatTimeAr(booking.end_time)}`
      : `${formatTimeEn(booking.start_time)} - ${formatTimeEn(booking.end_time)}`;

    await sendWhatsAppConfirmation(customer.phone, {
      courtName,
      date,
      time,
      price: booking.price.toString(),
      mapsLink,
      cancelLink,
    });
  } catch (error) {
    console.error(
      '[Notification] Failed to send WhatsApp booking confirmation:',
      error
    );
  }

  return { googleEventId };
}

/**
 * Send a booking reminder 24 hours before the booking.
 */
export async function sendBookingReminder(
  booking: Booking & { court?: Court },
  customer: Customer
): Promise<void> {
  try {
    const isArabic = customer.preferred_lang === 'ar';
    const courtName = isArabic
      ? booking.court?.name_ar || booking.court?.name || 'Court'
      : booking.court?.name || 'Court';
    const date = isArabic
      ? formatDateAr(booking.start_time)
      : formatDateEn(booking.start_time);
    const time = isArabic
      ? formatTimeAr(booking.start_time)
      : formatTimeEn(booking.start_time);

    const cancelLink = `${FRONTEND_URL}/booking/${booking.cancel_token}`;

    const message = isArabic
      ? `تذكير: لديك حجز غداً

الملعب: ${courtName}
التاريخ: ${date}
الوقت: ${time}

لإلغاء أو تعديل الحجز:
${cancelLink}

نتطلع لرؤيتك!`
      : `Reminder: You have a booking tomorrow

Court: ${courtName}
Date: ${date}
Time: ${time}

To cancel or modify:
${cancelLink}

See you there!`;

    await sendWhatsAppMessage(customer.phone, message);
  } catch (error) {
    console.error(
      '[Notification] Failed to send booking reminder:',
      error
    );
  }
}

/**
 * Handle cancellation: delete the Google Calendar event and send
 * a WhatsApp cancellation notice.
 */
export async function sendCancellationNotification(
  booking: Booking & { court?: Court },
  customer: Customer
): Promise<void> {
  // 1. Delete Google Calendar event
  try {
    if (booking.google_event_id && booking.court?.google_cal_id) {
      await deleteCalendarEvent(
        booking.google_event_id,
        booking.court.google_cal_id
      );
    }
  } catch (error) {
    console.error(
      '[Notification] Failed to delete Google Calendar event:',
      error
    );
  }

  // 2. Send WhatsApp cancellation
  try {
    const isArabic = customer.preferred_lang === 'ar';
    const courtName = isArabic
      ? booking.court?.name_ar || booking.court?.name || 'Court'
      : booking.court?.name || 'Court';
    const date = isArabic
      ? formatDateAr(booking.start_time)
      : formatDateEn(booking.start_time);
    const time = isArabic
      ? formatTimeAr(booking.start_time)
      : formatTimeEn(booking.start_time);

    const message = isArabic
      ? `تم إلغاء حجزك

الملعب: ${courtName}
التاريخ: ${date}
الوقت: ${time}

إذا كنت ترغب في إعادة الحجز، لا تتردد في التواصل معنا.`
      : `Your booking has been cancelled

Court: ${courtName}
Date: ${date}
Time: ${time}

If you'd like to rebook, feel free to contact us.`;

    await sendWhatsAppMessage(customer.phone, message);
  } catch (error) {
    console.error(
      '[Notification] Failed to send cancellation WhatsApp message:',
      error
    );
  }
}

/**
 * Handle modification: update the Google Calendar event and send
 * a WhatsApp notification about the change.
 */
export async function sendModificationNotification(
  booking: Booking & { court?: Court },
  customer: Customer
): Promise<void> {
  // 1. Update Google Calendar event
  try {
    if (booking.google_event_id && booking.court?.google_cal_id) {
      await updateCalendarEvent(
        booking.google_event_id,
        booking.court.google_cal_id,
        {
          start_time: booking.start_time,
          end_time: booking.end_time,
          customer_name: customer.name || customer.phone,
          booking_type: booking.booking_type,
        }
      );
    }
  } catch (error) {
    console.error(
      '[Notification] Failed to update Google Calendar event:',
      error
    );
  }

  // 2. Send WhatsApp modification notice
  try {
    const isArabic = customer.preferred_lang === 'ar';
    const courtName = isArabic
      ? booking.court?.name_ar || booking.court?.name || 'Court'
      : booking.court?.name || 'Court';
    const date = isArabic
      ? formatDateAr(booking.start_time)
      : formatDateEn(booking.start_time);
    const time = isArabic
      ? `${formatTimeAr(booking.start_time)} - ${formatTimeAr(booking.end_time)}`
      : `${formatTimeEn(booking.start_time)} - ${formatTimeEn(booking.end_time)}`;

    const cancelLink = `${FRONTEND_URL}/booking/${booking.cancel_token}`;

    const message = isArabic
      ? `تم تعديل حجزك بنجاح

الملعب: ${courtName}
التاريخ الجديد: ${date}
الوقت الجديد: ${time}
السعر: ${booking.price} دينار

لإلغاء أو تعديل الحجز:
${cancelLink}`
      : `Your booking has been updated

Court: ${courtName}
New date: ${date}
New time: ${time}
Price: ${booking.price} JOD

To cancel or modify:
${cancelLink}`;

    await sendWhatsAppMessage(customer.phone, message);
  } catch (error) {
    console.error(
      '[Notification] Failed to send modification WhatsApp message:',
      error
    );
  }
}
