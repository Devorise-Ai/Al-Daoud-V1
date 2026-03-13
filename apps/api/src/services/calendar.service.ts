import { query } from '../config/database';
import { TimeSlot, Court } from '../../../../packages/shared/src/types';
import { BUSINESS_HOURS, SLOT_DURATION } from '../../../../packages/shared/src/constants';
import { getPrice } from './pricing.service';

/**
 * Get available time slots for a given date, optionally filtered by court.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param courtId - Optional court ID to filter by
 * @param duration - Slot duration in minutes (default: 60)
 * @returns Array of TimeSlot objects
 */
export async function getAvailableSlots(
  date: string,
  courtId?: string,
  duration: number = SLOT_DURATION
): Promise<TimeSlot[]> {
  // Fetch courts
  let courts: Court[];
  if (courtId) {
    const courtResult = await query(
      'SELECT * FROM courts WHERE id = $1 AND is_active = true',
      [courtId]
    );
    courts = courtResult.rows;
  } else {
    const courtResult = await query('SELECT * FROM courts WHERE is_active = true ORDER BY name ASC');
    courts = courtResult.rows;
  }

  if (courts.length === 0) {
    return [];
  }

  // Fetch existing bookings for the date and relevant courts
  const courtIds = courts.map((c) => c.id);
  const bookingsResult = await query(
    `SELECT court_id, start_time, end_time FROM bookings
     WHERE court_id = ANY($1)
       AND start_time::date = $2
       AND status NOT IN ('cancelled')
     ORDER BY start_time ASC`,
    [courtIds, date]
  );

  const bookings = bookingsResult.rows as Array<{
    court_id: string;
    start_time: string;
    end_time: string;
  }>;

  // Build a lookup of bookings per court
  const bookingsByCourt = new Map<string, Array<{ start: Date; end: Date }>>();
  for (const b of bookings) {
    const list = bookingsByCourt.get(b.court_id) || [];
    list.push({ start: new Date(b.start_time), end: new Date(b.end_time) });
    bookingsByCourt.set(b.court_id, list);
  }

  // Generate slots for each court
  const slots: TimeSlot[] = [];
  const slotDurationMs = duration * 60 * 1000;

  for (const court of courts) {
    const courtBookings = bookingsByCourt.get(court.id) || [];

    // Generate slots from open to close
    for (let hour = BUSINESS_HOURS.open; hour < BUSINESS_HOURS.close; hour++) {
      // For durations smaller than 60 min, generate sub-hour slots
      const slotsPerHour = 60 / duration;
      for (let sub = 0; sub < slotsPerHour; sub++) {
        const minuteOffset = sub * duration;

        // Build the start/end time in Jordan time (UTC+3)
        // We construct ISO strings representing Jordan local time
        const startHour = String(hour).padStart(2, '0');
        const startMin = String(minuteOffset).padStart(2, '0');
        const slotStart = new Date(`${date}T${startHour}:${startMin}:00+03:00`);
        const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

        // Skip if slot goes past closing time
        const closeTime = new Date(`${date}T${BUSINESS_HOURS.close === 24 ? '00' : String(BUSINESS_HOURS.close).padStart(2, '0')}:00:00+03:00`);
        if (BUSINESS_HOURS.close === 24) {
          // Midnight means next day 00:00
          closeTime.setDate(closeTime.getDate() + 1);
        }
        if (slotEnd > closeTime) {
          continue;
        }

        // Check if slot overlaps with any booking
        const isBooked = courtBookings.some((booking) => {
          return slotStart < booking.end && slotEnd > booking.start;
        });

        // Skip past slots (if today)
        const now = new Date();
        const isPast = slotStart < now;

        // Get pricing
        const priceInfo = await getPrice(court.id, slotStart);

        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          court_id: court.id,
          court_name: court.name,
          price: priceInfo.price,
          is_peak: priceInfo.is_peak,
          available: !isBooked && !isPast,
        });
      }
    }
  }

  return slots;
}

/**
 * Get weekly availability for a specific court starting from a given date.
 *
 * @param courtId - Court ID
 * @param startDate - Start date string in YYYY-MM-DD format
 * @returns Object mapping date strings to arrays of TimeSlots
 */
export async function getWeeklyAvailability(
  courtId: string,
  startDate: string
): Promise<Record<string, TimeSlot[]>> {
  const result: Record<string, TimeSlot[]> = {};
  const start = new Date(`${startDate}T00:00:00+03:00`);

  for (let i = 0; i < 7; i++) {
    const current = new Date(start);
    current.setDate(current.getDate() + i);

    const dateStr = current.toISOString().split('T')[0];
    result[dateStr] = await getAvailableSlots(dateStr, courtId);
  }

  return result;
}

/**
 * Check if a specific slot is available for a court.
 *
 * @param courtId - Court ID
 * @param startTime - Slot start time (ISO string or Date)
 * @param endTime - Slot end time (ISO string or Date)
 * @returns true if the slot is available
 */
export async function isSlotAvailable(
  courtId: string,
  startTime: string | Date,
  endTime: string | Date
): Promise<boolean> {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  // Check the slot is not in the past
  if (start < new Date()) {
    return false;
  }

  // Check for overlapping non-cancelled bookings
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM bookings
     WHERE court_id = $1
       AND status NOT IN ('cancelled')
       AND start_time < $3
       AND end_time > $2`,
    [courtId, start.toISOString(), end.toISOString()]
  );

  return result.rows[0].count === 0;
}
