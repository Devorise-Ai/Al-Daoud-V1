// Google Calendar Integration for Al Daoud Football Courts
// npm install googleapis

import { env } from '../config/env';

// googleapis and google-auth-library are imported dynamically to avoid
// crashing the server when these optional packages are not installed.
let google: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  google = require('googleapis').google;
} catch {
  console.warn(
    '[Google Calendar] googleapis package is not installed. Calendar integration is disabled. Run: npm install googleapis'
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CalendarBooking {
  court_google_cal_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  customer_name: string;
  booking_type: string;
  booking_id?: string;
}

interface CalendarEventUpdate {
  start_time?: string;
  end_time?: string;
  customer_name?: string;
  booking_type?: string;
}

interface CalendarDiscrepancy {
  type: 'missing_in_calendar' | 'missing_in_db' | 'time_mismatch';
  booking_id?: string;
  google_event_id?: string;
  details: string;
}

// ---------------------------------------------------------------------------
// Singleton calendar API instance
// ---------------------------------------------------------------------------
let calendarInstance: any = null;

/**
 * Initialise the Google Calendar API client using a service-account key
 * stored in the GOOGLE_SERVICE_ACCOUNT_KEY environment variable (JSON string)
 * or individual GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY env vars.
 *
 * Returns the calendar API instance, or null if credentials are missing.
 */
export function initCalendar(): any {
  if (calendarInstance) return calendarInstance;
  if (!google) return null;

  try {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    let credentials: { client_email: string; private_key: string } | null =
      null;

    if (keyJson) {
      credentials = JSON.parse(keyJson);
    } else if (
      process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    ) {
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    if (!credentials) {
      console.warn(
        '[Google Calendar] No credentials configured. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY env vars. Calendar integration is disabled.'
      );
      return null;
    }

    const auth = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );

    calendarInstance = google.calendar({ version: 'v3', auth });
    console.log('[Google Calendar] Initialised successfully.');
    return calendarInstance;
  } catch (error) {
    console.error('[Google Calendar] Failed to initialise:', error);
    return null;
  }
}

/**
 * Create a calendar event for a booking.
 * Returns the Google event ID, or null if the calendar is not configured.
 */
export async function createCalendarEvent(
  booking: CalendarBooking
): Promise<string | null> {
  const calendar = initCalendar();
  if (!calendar) {
    console.log(
      '[Google Calendar] Skipping event creation — calendar not initialised.'
    );
    return null;
  }

  try {
    const event = {
      summary: `${booking.booking_type === 'regular' ? 'Booking' : booking.booking_type} — ${booking.customer_name}`,
      description: [
        `Customer: ${booking.customer_name}`,
        `Type: ${booking.booking_type}`,
        booking.booking_id ? `Booking ID: ${booking.booking_id}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      start: {
        dateTime: booking.start_time,
        timeZone: 'Asia/Amman',
      },
      end: {
        dateTime: booking.end_time,
        timeZone: 'Asia/Amman',
      },
      colorId: booking.booking_type === 'birthday' ? '5' : '10', // banana-yellow for events, basil-green for regular
    };

    const response = await calendar.events.insert({
      calendarId: booking.court_google_cal_id,
      requestBody: event,
    });

    console.log(
      `[Google Calendar] Event created: ${response.data.id} on calendar ${booking.court_google_cal_id}`
    );
    return response.data.id as string;
  } catch (error) {
    console.error('[Google Calendar] Failed to create event:', error);
    return null;
  }
}

/**
 * Update an existing calendar event (e.g. when a customer modifies their booking time).
 */
export async function updateCalendarEvent(
  eventId: string,
  calendarId: string,
  updates: CalendarEventUpdate
): Promise<boolean> {
  const calendar = initCalendar();
  if (!calendar) {
    console.log(
      '[Google Calendar] Skipping event update — calendar not initialised.'
    );
    return false;
  }

  try {
    const patch: Record<string, any> = {};

    if (updates.start_time) {
      patch.start = { dateTime: updates.start_time, timeZone: 'Asia/Amman' };
    }
    if (updates.end_time) {
      patch.end = { dateTime: updates.end_time, timeZone: 'Asia/Amman' };
    }
    if (updates.customer_name || updates.booking_type) {
      const type = updates.booking_type || 'Booking';
      const name = updates.customer_name || '';
      patch.summary = `${type} — ${name}`;
    }

    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: patch,
    });

    console.log(
      `[Google Calendar] Event updated: ${eventId} on calendar ${calendarId}`
    );
    return true;
  } catch (error) {
    console.error('[Google Calendar] Failed to update event:', error);
    return false;
  }
}

/**
 * Delete a calendar event (e.g. when a booking is cancelled).
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string
): Promise<boolean> {
  const calendar = initCalendar();
  if (!calendar) {
    console.log(
      '[Google Calendar] Skipping event deletion — calendar not initialised.'
    );
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(
      `[Google Calendar] Event deleted: ${eventId} from calendar ${calendarId}`
    );
    return true;
  } catch (error) {
    console.error('[Google Calendar] Failed to delete event:', error);
    return false;
  }
}

/**
 * Sync Google Calendar events with the bookings table for a specific court.
 * Reads events from Google Calendar, compares with bookings in the database,
 * and logs any discrepancies.
 *
 * This is intended to run periodically (e.g. via a cron job).
 */
export async function syncCalendar(
  courtId: string,
  options?: {
    calendarId: string;
    /** Bookings from the DB for comparison */
    dbBookings: Array<{
      id: string;
      google_event_id?: string;
      start_time: string;
      end_time: string;
      status: string;
    }>;
  }
): Promise<CalendarDiscrepancy[]> {
  const calendar = initCalendar();
  if (!calendar || !options) {
    console.log(
      '[Google Calendar] Skipping sync — calendar not initialised or no options provided.'
    );
    return [];
  }

  const discrepancies: CalendarDiscrepancy[] = [];

  try {
    // Fetch upcoming events from Google Calendar
    const now = new Date();
    const twoWeeksLater = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000
    );

    const response = await calendar.events.list({
      calendarId: options.calendarId,
      timeMin: now.toISOString(),
      timeMax: twoWeeksLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const googleEvents: any[] = response.data.items || [];
    const googleEventIds = new Set(googleEvents.map((e: any) => e.id));

    // Check DB bookings that should have Google events
    const activeBookings = options.dbBookings.filter(
      (b) => b.status !== 'cancelled'
    );

    for (const booking of activeBookings) {
      if (booking.google_event_id) {
        if (!googleEventIds.has(booking.google_event_id)) {
          discrepancies.push({
            type: 'missing_in_calendar',
            booking_id: booking.id,
            google_event_id: booking.google_event_id,
            details: `Booking ${booking.id} has google_event_id ${booking.google_event_id} but event not found in Google Calendar.`,
          });
        }
      }
    }

    // Check Google events that might not have matching bookings
    const dbEventIds = new Set(
      activeBookings
        .map((b) => b.google_event_id)
        .filter(Boolean)
    );

    for (const event of googleEvents) {
      if (!dbEventIds.has(event.id)) {
        discrepancies.push({
          type: 'missing_in_db',
          google_event_id: event.id,
          details: `Google Calendar event ${event.id} ("${event.summary}") has no matching booking in the database.`,
        });
      }
    }

    if (discrepancies.length > 0) {
      console.warn(
        `[Google Calendar] Sync found ${discrepancies.length} discrepancies for court ${courtId}:`,
        discrepancies
      );
    } else {
      console.log(
        `[Google Calendar] Sync complete for court ${courtId} — no discrepancies found.`
      );
    }
  } catch (error) {
    console.error(
      `[Google Calendar] Sync failed for court ${courtId}:`,
      error
    );
  }

  return discrepancies;
}
