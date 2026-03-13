import { Router, Request, Response } from 'express';
import { courtSchema } from '../../../../packages/shared/src/validation';
import * as courtsDb from '../db/queries/courts';

const router = Router();

/**
 * GET /api/v1/courts
 * List all courts, optionally filtered by type and is_active.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, is_active } = req.query;

    const filters: courtsDb.CourtFilters = {};
    if (type && ['5v5', '7v7', '11v11'].includes(type as string)) {
      filters.type = type as courtsDb.CourtFilters['type'];
    }
    if (is_active !== undefined) {
      filters.is_active = is_active === 'true';
    }

    const courts = await courtsDb.findAll(filters);
    res.json({ data: courts });
  } catch (error) {
    console.error('Error listing courts:', error);
    res.status(500).json({ error: 'Failed to fetch courts' });
  }
});

/**
 * GET /api/v1/courts/:id
 * Get a single court by ID.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const court = await courtsDb.findById(req.params.id);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    res.json({ data: court });
  } catch (error) {
    console.error('Error fetching court:', error);
    res.status(500).json({ error: 'Failed to fetch court' });
  }
});

/**
 * POST /api/v1/courts
 * Create a new court.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = courtSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const court = await courtsDb.create(parsed.data as any);
    res.status(201).json({ data: court });
  } catch (error) {
    console.error('Error creating court:', error);
    res.status(500).json({ error: 'Failed to create court' });
  }
});

/**
 * PATCH /api/v1/courts/:id
 * Update court fields.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    // Validate with partial schema
    const partialSchema = courtSchema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    // Verify court exists
    const existing = await courtsDb.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const updated = await courtsDb.update(req.params.id, parsed.data);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating court:', error);
    res.status(500).json({ error: 'Failed to update court' });
  }
});

export default router;
