import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as customerService from '../services/customer.service';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/customers
 * List customers with optional filters and pagination.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, segment, sort_by, sort_order, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (search) filters.search = search as string;
    if (segment) filters.segment = segment as string;
    if (sort_by) filters.sort_by = sort_by as string;
    if (sort_order) filters.sort_order = sort_order as string;
    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const pageNum = filters.page || 1;
    const limitNum = filters.limit || 20;

    const { rows, total } = await customerService.getCustomers(filters);

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/v1/customers/segments
 * Return segment summary statistics.
 * IMPORTANT: This route must be defined BEFORE /:id to avoid "segments" being treated as an ID.
 */
router.get('/segments', async (_req: Request, res: Response) => {
  try {
    const stats = await customerService.getSegmentStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching segment stats:', error);
    res.status(500).json({ error: 'Failed to fetch segment statistics' });
  }
});

/**
 * GET /api/v1/customers/:id
 * Get a single customer's full profile.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json({ data: customer });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

/**
 * PATCH /api/v1/customers/:id
 * Update a customer's profile fields.
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json({ data: customer });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

/**
 * GET /api/v1/customers/:id/bookings
 * Get a customer's booking history.
 */
router.get('/:id/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await customerService.getCustomerBookings(req.params.id);
    res.json({ data: bookings });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ error: 'Failed to fetch customer bookings' });
  }
});

export default router;
