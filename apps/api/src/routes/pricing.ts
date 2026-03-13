import { Router, Request, Response } from 'express';
import { pricingRuleSchema } from '../../../../packages/shared/src/validation';
import * as pricingDb from '../db/queries/pricing';

const router = Router();

/**
 * GET /api/v1/pricing
 * List all pricing rules with court name when court-specific.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const rules = await pricingDb.findAll();
    res.json({ data: rules });
  } catch (error) {
    console.error('Error listing pricing rules:', error);
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

/**
 * POST /api/v1/pricing
 * Create a new pricing rule.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = pricingRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const rule = await pricingDb.create(parsed.data as any);
    res.status(201).json({ data: rule });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({ error: 'Failed to create pricing rule' });
  }
});

/**
 * PATCH /api/v1/pricing/:id
 * Update a pricing rule.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const partialSchema = pricingRuleSchema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await pricingDb.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    const updated = await pricingDb.update(req.params.id, parsed.data);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({ error: 'Failed to update pricing rule' });
  }
});

export default router;
