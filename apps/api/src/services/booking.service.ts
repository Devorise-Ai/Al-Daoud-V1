import { query } from '../config/database';
import * as bookingsDb from '../db/queries/bookings';
import { isSlotAvailable } from './calendar.service';
import { getPrice } from './pricing.service';
import { Booking } from '../../../../packages/shared/src/types';

interface CreateBookingInput {
  customer_id: string;
  court_id: string;
  booking_type: Booking['booking_type'];
  start_time: string;
  end_time: string;
  source: Booking['source'];
  notes?: string;
}

interface ModifyBookingInput {
  start_time?: string;
  end_time?: string;
  court_id?: string;
  status?: Booking['status'];
  payment_status?: Booking['payment_status'];
  notes?: string;
}

export async function createBooking(data: CreateBookingInput): Promise<Booking> {
  // Check slot availability
  const available = await isSlotAvailable(data.court_id, data.start_time, data.end_time);
  if (!available) {
    const error = new Error('The requested time slot is not available');
    (error as any).code = 'SLOT_UNAVAILABLE';
    throw error;
  }

  // Calculate price
  const priceResult = await getPrice(data.court_id, new Date(data.start_time));

  // Calculate duration-based price (price is per hour)
  const durationMs = new Date(data.end_time).getTime() - new Date(data.start_time).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  const totalPrice = Math.round(priceResult.price * durationHours * 100) / 100;

  // Create the booking
  const booking = await bookingsDb.create({
    customer_id: data.customer_id,
    court_id: data.court_id,
    booking_type: data.booking_type,
    start_time: data.start_time,
    end_time: data.end_time,
    price: totalPrice,
    source: data.source,
    notes: data.notes,
  });

  // Update customer stats
  await query(
    `UPDATE customers
     SET total_bookings = total_bookings + 1,
         total_spent = total_spent + $1,
         last_contact = NOW(),
         updated_at = NOW()
     WHERE id = $2`,
    [totalPrice, data.customer_id]
  );

  return booking;
}

export async function modifyBooking(
  id: string,
  data: ModifyBookingInput
): Promise<Booking> {
  const existing = await bookingsDb.findById(id);
  if (!existing) {
    const error = new Error('Booking not found');
    (error as any).code = 'NOT_FOUND';
    throw error;
  }

  if (existing.status === 'cancelled') {
    const error = new Error('Cannot modify a cancelled booking');
    (error as any).code = 'BOOKING_CANCELLED';
    throw error;
  }

  // If time or court changed, check availability
  const courtChanged = data.court_id && data.court_id !== existing.court_id;
  const timeChanged = data.start_time || data.end_time;

  if (courtChanged || timeChanged) {
    const courtId = data.court_id || existing.court_id;
    const startTime = data.start_time || existing.start_time;
    const endTime = data.end_time || existing.end_time;

    // Temporarily cancel current booking to allow checking the same slot
    // We check manually excluding the current booking
    const checkResult = await query(
      `SELECT COUNT(*)::int AS count FROM bookings
       WHERE court_id = $1
         AND id != $2
         AND status NOT IN ('cancelled')
         AND start_time < $4
         AND end_time > $3`,
      [courtId, id, startTime, endTime]
    );

    if (checkResult.rows[0].count > 0) {
      const error = new Error('The requested time slot is not available');
      (error as any).code = 'SLOT_UNAVAILABLE';
      throw error;
    }

    // Recalculate price if time or court changed
    const priceResult = await getPrice(courtId, new Date(startTime));
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const totalPrice = Math.round(priceResult.price * durationHours * 100) / 100;

    (data as any).price = totalPrice;
  }

  const updated = await bookingsDb.update(id, data);
  if (!updated) {
    const error = new Error('Failed to update booking');
    (error as any).code = 'UPDATE_FAILED';
    throw error;
  }

  return updated;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const existing = await bookingsDb.findById(id);
  if (!existing) {
    const error = new Error('Booking not found');
    (error as any).code = 'NOT_FOUND';
    throw error;
  }

  if (existing.status === 'cancelled') {
    const error = new Error('Booking is already cancelled');
    (error as any).code = 'ALREADY_CANCELLED';
    throw error;
  }

  const cancelled = await bookingsDb.update(id, { status: 'cancelled' });

  // Update customer stats
  await query(
    `UPDATE customers
     SET total_bookings = GREATEST(total_bookings - 1, 0),
         total_spent = GREATEST(total_spent - $1, 0),
         updated_at = NOW()
     WHERE id = $2`,
    [existing.price, existing.customer_id]
  );

  return cancelled!;
}

export async function getBookings(filters?: bookingsDb.BookingFilters) {
  return bookingsDb.findAll(filters);
}

export async function getBookingById(id: string) {
  const booking = await bookingsDb.findById(id);
  if (!booking) {
    const error = new Error('Booking not found');
    (error as any).code = 'NOT_FOUND';
    throw error;
  }
  return booking;
}

export async function getBookingByToken(token: string) {
  const booking = await bookingsDb.findByToken(token);
  if (!booking) {
    const error = new Error('Booking not found');
    (error as any).code = 'NOT_FOUND';
    throw error;
  }
  return booking;
}

export async function cancelByToken(token: string): Promise<Booking> {
  const existing = await bookingsDb.findByToken(token);
  if (!existing) {
    const error = new Error('Booking not found');
    (error as any).code = 'NOT_FOUND';
    throw error;
  }

  if (existing.status === 'cancelled') {
    const error = new Error('Booking is already cancelled');
    (error as any).code = 'ALREADY_CANCELLED';
    throw error;
  }

  const cancelled = await bookingsDb.cancelByToken(token);
  if (!cancelled) {
    const error = new Error('Failed to cancel booking');
    (error as any).code = 'CANCEL_FAILED';
    throw error;
  }

  // Update customer stats
  await query(
    `UPDATE customers
     SET total_bookings = GREATEST(total_bookings - 1, 0),
         total_spent = GREATEST(total_spent - $1, 0),
         updated_at = NOW()
     WHERE id = $2`,
    [existing.price, existing.customer_id]
  );

  return cancelled;
}
