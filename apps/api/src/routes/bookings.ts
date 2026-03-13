import { Router, Request, Response } from 'express';
import {
  createBookingSchema,
  updateBookingSchema,
} from '../../../../packages/shared/src/validation';
import * as bookingService from '../services/booking.service';

const router = Router();

/**
 * GET /api/v1/bookings
 * List bookings with optional filters and pagination.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      date_from,
      date_to,
      court_id,
      customer_id,
      status,
      source,
      page,
      limit,
    } = req.query;

    const filters: Record<string, any> = {};

    if (date_from) filters.date_from = date_from as string;
    if (date_to) filters.date_to = date_to as string;
    if (court_id) filters.court_id = court_id as string;
    if (customer_id) filters.customer_id = customer_id as string;
    if (status) filters.status = status as string;
    if (source) filters.source = source as string;
    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const result = await bookingService.getBookings(filters);
    res.json(result);
  } catch (error) {
    console.error('Error listing bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

/**
 * GET /api/v1/bookings/public/:token
 * Get booking details by public cancel token (no auth required).
 */
router.get('/public/:token', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingByToken(req.params.token);
    res.json({ data: booking });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.error('Error fetching booking by token:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

/**
 * PATCH /api/v1/bookings/public/:token
 * Modify booking via public link (only time changes allowed).
 */
router.patch('/public/:token', async (req: Request, res: Response) => {
  try {
    // Only allow time changes via public link
    const allowedFields = ['start_time', 'end_time'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update. Only start_time and end_time can be changed via public link.',
      });
    }

    // Validate the time fields
    const partialSchema = updateBookingSchema.pick({
      start_time: true,
      end_time: true,
    });
    const parsed = partialSchema.safeParse(updateData);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Find booking by token first
    const existing = await bookingService.getBookingByToken(req.params.token);
    const updated = await bookingService.modifyBooking(existing.id, parsed.data);

    res.json({ data: updated });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (error.code === 'SLOT_UNAVAILABLE') {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === 'BOOKING_CANCELLED') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error modifying booking via token:', error);
    res.status(500).json({ error: 'Failed to modify booking' });
  }
});

/**
 * GET /api/v1/bookings/:id
 * Get a single booking by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    res.json({ data: booking });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

/**
 * POST /api/v1/bookings
 * Create a new booking.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const booking = await bookingService.createBooking(parsed.data);
    res.status(201).json({ data: booking });
  } catch (error: any) {
    if (error.code === 'SLOT_UNAVAILABLE') {
      return res.status(409).json({ error: error.message });
    }
    // PostgreSQL exclusion constraint violation
    if (error.code === '23P01') {
      return res.status(409).json({
        error: 'This time slot conflicts with an existing booking',
      });
    }
    // Foreign key violation (invalid customer_id or court_id)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Invalid customer or court ID',
      });
    }
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

/**
 * PATCH /api/v1/bookings/:id
 * Modify an existing booking.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = updateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const booking = await bookingService.modifyBooking(req.params.id, parsed.data);
    res.json({ data: booking });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (error.code === 'SLOT_UNAVAILABLE') {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === 'BOOKING_CANCELLED') {
      return res.status(400).json({ error: error.message });
    }
    // PostgreSQL exclusion constraint violation
    if (error.code === '23P01') {
      return res.status(409).json({
        error: 'This time slot conflicts with an existing booking',
      });
    }
    console.error('Error modifying booking:', error);
    res.status(500).json({ error: 'Failed to modify booking' });
  }
});

/**
 * DELETE /api/v1/bookings/:id
 * Cancel a booking (soft delete — sets status to 'cancelled').
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id);
    res.json({ data: booking });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (error.code === 'ALREADY_CANCELLED') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
