import { Router, Request, Response } from 'express';
import { availabilityQuerySchema } from '../../../../packages/shared/src/validation';
import { getAvailableSlots, getWeeklyAvailability } from '../services/calendar.service';

const router = Router();

/**
 * GET /api/v1/availability
 * Get available time slots for a given date.
 * Query params:
 *   - date (required, YYYY-MM-DD)
 *   - court_id (optional, UUID)
 *   - duration (optional, default 60 minutes)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, court_id, duration } = req.query;

    const parsed = availabilityQuerySchema.safeParse({
      date,
      court_id: court_id || undefined,
      duration: duration ? Number(duration) : undefined,
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const slots = await getAvailableSlots(
      parsed.data.date,
      parsed.data.court_id,
      parsed.data.duration
    );

    res.json({
      data: slots,
      meta: {
        date: parsed.data.date,
        court_id: parsed.data.court_id || null,
        duration: parsed.data.duration,
        total_slots: slots.length,
        available_slots: slots.filter((s) => s.available).length,
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * GET /api/v1/availability/week
 * Get weekly availability for a specific court.
 * Query params:
 *   - court_id (required, UUID)
 *   - start_date (required, YYYY-MM-DD)
 */
router.get('/week', async (req: Request, res: Response) => {
  try {
    const { court_id, start_date } = req.query;

    if (!court_id || typeof court_id !== 'string') {
      return res.status(400).json({ error: 'court_id is required' });
    }

    if (!start_date || typeof start_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return res.status(400).json({ error: 'start_date is required and must be YYYY-MM-DD format' });
    }

    const weekly = await getWeeklyAvailability(court_id, start_date);

    // Compute summary per day
    const summary = Object.entries(weekly).map(([date, slots]) => ({
      date,
      total_slots: slots.length,
      available_slots: slots.filter((s) => s.available).length,
    }));

    res.json({
      data: weekly,
      meta: {
        court_id,
        start_date,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching weekly availability:', error);
    res.status(500).json({ error: 'Failed to fetch weekly availability' });
  }
});

export default router;
