import { query } from '../../config/database';
import { Court } from '../../../../../packages/shared/src/types';

export interface CourtFilters {
  type?: Court['type'];
  is_active?: boolean;
}

export async function findAll(filters?: CourtFilters): Promise<Court[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.type) {
    conditions.push(`type = $${paramIndex++}`);
    params.push(filters.type);
  }

  if (filters?.is_active !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(filters.is_active);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM courts ${whereClause} ORDER BY name ASC`;

  const result = await query(sql, params);
  return result.rows;
}

export async function findById(id: string): Promise<Court | null> {
  const result = await query('SELECT * FROM courts WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data: Omit<Court, 'id' | 'created_at' | 'updated_at'>): Promise<Court> {
  const sql = `
    INSERT INTO courts (name, name_ar, type, surface, capacity, hourly_rate, peak_rate, maps_link, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const params = [
    data.name,
    data.name_ar,
    data.type,
    data.surface,
    data.capacity,
    data.hourly_rate,
    data.peak_rate,
    data.maps_link || null,
    data.is_active ?? true,
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<Omit<Court, 'id' | 'created_at' | 'updated_at'>>
): Promise<Court | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'name', 'name_ar', 'type', 'surface', 'capacity',
    'hourly_rate', 'peak_rate', 'maps_link', 'is_active',
    'google_cal_id', 'location_lat', 'location_lng',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const sql = `UPDATE courts SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}
