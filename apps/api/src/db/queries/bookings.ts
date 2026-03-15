import crypto from 'crypto';
import { query } from '../../config/database';
import { Booking } from '../../../../../packages/shared/src/types';

export interface BookingFilters {
  date_from?: string;
  date_to?: string;
  court_id?: string;
  customer_id?: string;
  status?: Booking['status'];
  source?: Booking['source'];
  page?: number;
  limit?: number;
}

export interface BookingWithDetails extends Booking {
  customer_name?: string;
  customer_phone?: string;
  court_name?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export async function findAll(
  filters?: BookingFilters
): Promise<PaginatedResult<BookingWithDetails>> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.date_from) {
    conditions.push(`b.start_time >= $${paramIndex++}`);
    params.push(filters.date_from);
  }

  if (filters?.date_to) {
    conditions.push(`b.start_time <= $${paramIndex++}`);
    params.push(filters.date_to);
  }

  if (filters?.court_id) {
    conditions.push(`b.court_id = $${paramIndex++}`);
    params.push(filters.court_id);
  }

  if (filters?.customer_id) {
    conditions.push(`b.customer_id = $${paramIndex++}`);
    params.push(filters.customer_id);
  }

  if (filters?.status) {
    conditions.push(`b.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters?.source) {
    conditions.push(`b.source = $${paramIndex++}`);
    params.push(filters.source);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matching rows
  const countSql = `SELECT COUNT(*)::int AS total FROM bookings b ${whereClause}`;
  const countResult = await query(countSql, params);
  const total: number = countResult.rows[0].total;

  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      b.*,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ct.name AS court_name
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN courts ct ON ct.id = b.court_id
    ${whereClause}
    ORDER BY b.start_time DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const result = await query(sql, params);

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function findById(id: string): Promise<BookingWithDetails | null> {
  const sql = `
    SELECT
      b.*,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ct.name AS court_name
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN courts ct ON ct.id = b.court_id
    WHERE b.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function findByToken(cancelToken: string): Promise<BookingWithDetails | null> {
  const sql = `
    SELECT
      b.*,
      c.name AS customer_name,
      c.phone AS customer_phone,
      ct.name AS court_name
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN courts ct ON ct.id = b.court_id
    WHERE b.cancel_token = $1
  `;
  const result = await query(sql, [cancelToken]);
  return result.rows[0] || null;
}

export interface CreateBookingData {
  customer_id: string;
  court_id: string;
  booking_type: Booking['booking_type'];
  start_time: string;
  end_time: string;
  price: number;
  discount?: number;
  source: Booking['source'];
  notes?: string;
}

export async function create(data: CreateBookingData): Promise<Booking> {
  const cancelToken = crypto.randomBytes(32).toString('hex');

  const startDate = new Date(data.start_time);
  const endDate = new Date(data.end_time);
  const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  const sql = `
    INSERT INTO bookings (
      customer_id, court_id, booking_type, status, start_time, end_time,
      duration_mins, price, discount, payment_status, cancel_token, source, notes
    )
    VALUES ($1, $2, $3, 'confirmed', $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
    RETURNING *
  `;

  const params = [
    data.customer_id,
    data.court_id,
    data.booking_type,
    data.start_time,
    data.end_time,
    durationMins,
    data.price,
    data.discount ?? 0,
    cancelToken,
    data.source,
    data.notes || null,
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>
): Promise<Booking | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'court_id',
    'booking_type',
    'status',
    'start_time',
    'end_time',
    'duration_mins',
    'price',
    'discount',
    'payment_status',
    'google_event_id',
    'source',
    'notes',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return findById(id) as Promise<Booking | null>;
  }

  // Recalculate duration if start or end time changed
  if (data.start_time || data.end_time) {
    const existing = await findById(id);
    if (existing) {
      const startTime = data.start_time || existing.start_time;
      const endTime = data.end_time || existing.end_time;
      const durationMins = Math.round(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
      );
      fields.push(`duration_mins = $${paramIndex++}`);
      params.push(durationMins);
    }
  }

  fields.push('updated_at = NOW()');
  params.push(id);

  const sql = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function cancelByToken(token: string): Promise<Booking | null> {
  const sql = `
    UPDATE bookings
    SET status = 'cancelled', updated_at = NOW()
    WHERE cancel_token = $1 AND status != 'cancelled'
    RETURNING *
  `;
  const result = await query(sql, [token]);
  return result.rows[0] || null;
}
