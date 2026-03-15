import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as analyticsService from '../services/analytics.service';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/analytics/dashboard
 * Dashboard overview stats.
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getDashboardStats();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/v1/analytics/revenue?period=week|month|year
 * Revenue analytics with timeline and per-court breakdown.
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    if (!['week', 'month', 'year'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use week, month, or year.' });
    }
    const data = await analyticsService.getRevenueAnalytics(period as 'week' | 'month' | 'year');
    res.json({ data });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

/**
 * GET /api/v1/analytics/bookings?period=week|month|year
 * Booking analytics: daily distribution, peak hours, sources, statuses.
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';
    if (!['week', 'month', 'year'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Use week, month, or year.' });
    }
    const data = await analyticsService.getBookingAnalytics(period as 'week' | 'month' | 'year');
    res.json({ data });
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ error: 'Failed to fetch booking analytics' });
  }
});

/**
 * GET /api/v1/analytics/customers
 * Customer analytics: segments, top spenders, retention.
 */
router.get('/customers', async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getCustomerAnalytics();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ error: 'Failed to fetch customer analytics' });
  }
});

/**
 * GET /api/v1/analytics/ai
 * AI / conversation performance analytics.
 */
router.get('/ai', async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getAIAnalytics();
    res.json({ data });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({ error: 'Failed to fetch AI analytics' });
  }
});

export default router;
