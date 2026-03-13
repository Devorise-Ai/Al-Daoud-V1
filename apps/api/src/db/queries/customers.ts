import { query } from '../../config/database';

interface CustomerFilters {
  search?: string;
  segment?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const ALLOWED_SORT_COLUMNS = ['name', 'total_bookings', 'total_spent', 'last_contact', 'created_at'];

/**
 * Find all customers with optional filtering, sorting, and pagination.
 */
export async function findAll(filters: CustomerFilters = {}) {
  const {
    search,
    segment,
    sort_by = 'created_at',
    sort_order = 'desc',
    page = 1,
    limit = 20,
  } = filters;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (segment) {
    conditions.push(`segment = $${paramIndex}`);
    params.push(segment);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort column to prevent SQL injection
  const sortColumn = ALLOWED_SORT_COLUMNS.includes(sort_by) ? sort_by : 'created_at';
  const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;

  // Count query
  const countResult = await query(
    `SELECT COUNT(*) FROM customers ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query
  const dataResult = await query(
    `SELECT * FROM customers ${whereClause}
     ORDER BY ${sortColumn} ${sortDirection}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return { rows: dataResult.rows, total };
}

/**
 * Find a single customer by ID.
 */
export async function findById(id: string) {
  const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Find a single customer by phone number.
 */
export async function findByPhone(phone: string) {
  const result = await query('SELECT * FROM customers WHERE phone = $1', [phone]);
  return result.rows[0] || null;
}

/**
 * Update a customer's fields dynamically.
 * Only updates the provided fields (name, email, preferred_lang, notes, preferences).
 */
export async function update(id: string, data: Record<string, any>) {
  const allowedFields = ['name', 'email', 'preferred_lang', 'notes', 'preferences'];
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'preferences') {
        setClauses.push(`${field} = $${paramIndex}::jsonb`);
        params.push(JSON.stringify(data[field]));
      } else {
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(data[field]);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);

  params.push(id);
  const result = await query(
    `UPDATE customers SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );

  return result.rows[0] || null;
}

/**
 * Update a customer's segment.
 */
export async function updateSegment(id: string, segment: string) {
  const result = await query(
    `UPDATE customers SET segment = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [segment, id]
  );
  return result.rows[0] || null;
}

/**
 * Get booking history for a customer, joined with court names.
 */
export async function getBookingHistory(customerId: string) {
  const result = await query(
    `SELECT
       b.id,
       b.court_id,
       c.name AS court_name,
       b.booking_type,
       b.status,
       b.start_time,
       b.end_time,
       b.duration_mins,
       b.price,
       b.discount,
       b.payment_status,
       b.source,
       b.notes,
       b.created_at
     FROM bookings b
     JOIN courts c ON c.id = b.court_id
     WHERE b.customer_id = $1
     ORDER BY b.start_time DESC`,
    [customerId]
  );
  return result.rows;
}

/**
 * Get count of customers grouped by segment.
 */
export async function getSegmentCounts() {
  const result = await query(
    `SELECT segment, COUNT(*)::int AS count FROM customers GROUP BY segment`
  );
  return result.rows;
}
