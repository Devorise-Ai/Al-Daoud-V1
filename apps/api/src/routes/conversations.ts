import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/conversations
 * List conversations with optional status filter and pagination.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && ['active', 'completed', 'abandoned'].includes(status)) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM conversations c ${whereClause}`,
      params
    );
    const total = countResult.rows[0]?.total || 0;

    // Get conversations with customer info
    const dataParams = [...params, limit, offset];
    const result = await query(
      `SELECT
        c.id,
        c.customer_id,
        c.channel,
        c.status,
        c.messages,
        c.intent,
        c.resolved,
        c.started_at,
        c.ended_at,
        COALESCE(cu.name, 'Unknown') AS customer_name,
        COALESCE(cu.phone, '') AS customer_phone
      FROM conversations c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      ${whereClause}
      ORDER BY c.started_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      dataParams
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/v1/conversations/:id
 * Get a single conversation with full messages.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        c.id,
        c.customer_id,
        c.channel,
        c.status,
        c.messages,
        c.intent,
        c.resolved,
        c.started_at,
        c.ended_at,
        COALESCE(cu.name, 'Unknown') AS customer_name,
        COALESCE(cu.phone, '') AS customer_phone
      FROM conversations c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

export default router;
