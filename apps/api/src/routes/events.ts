import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as eventsDb from '../db/queries/events';

const eventPackageSchema = z.object({
  name: z.string().min(1).max(200),
  name_ar: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
  description_ar: z.string().max(2000).optional(),
  base_price: z.number().positive(),
  max_guests: z.number().int().positive().optional(),
  includes_decorations: z.boolean().default(false),
  includes_catering: z.boolean().default(false),
  duration_mins: z.number().int().positive(),
});

const router = Router();

/**
 * GET /api/v1/events/packages
 * List all active event packages.
 */
router.get('/packages', async (req: Request, res: Response) => {
  try {
    const packages = await eventsDb.findAllPackages();
    res.json({ data: packages });
  } catch (error) {
    console.error('Error listing event packages:', error);
    res.status(500).json({ error: 'Failed to fetch event packages' });
  }
});

/**
 * POST /api/v1/events/packages
 * Create a new event package.
 */
router.post('/packages', async (req: Request, res: Response) => {
  try {
    const parsed = eventPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const pkg = await eventsDb.createPackage(parsed.data as any);
    res.status(201).json({ data: pkg });
  } catch (error) {
    console.error('Error creating event package:', error);
    res.status(500).json({ error: 'Failed to create event package' });
  }
});

/**
 * PATCH /api/v1/events/packages/:id
 * Update an event package.
 */
router.patch('/packages/:id', async (req: Request, res: Response) => {
  try {
    const partialSchema = eventPackageSchema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await eventsDb.findPackageById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Event package not found' });
    }

    const updated = await eventsDb.updatePackage(req.params.id, parsed.data);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating event package:', error);
    res.status(500).json({ error: 'Failed to update event package' });
  }
});

export default router;
