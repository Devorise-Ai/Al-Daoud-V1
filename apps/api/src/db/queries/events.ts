import { query } from '../../config/database';
import { EventPackage, EventExtras } from '../../../../../packages/shared/src/types';

export async function findAllPackages(): Promise<EventPackage[]> {
  const sql = `
    SELECT * FROM event_packages
    WHERE is_active = true
    ORDER BY base_price ASC
  `;
  const result = await query(sql);
  return result.rows;
}

export async function findPackageById(id: string): Promise<EventPackage | null> {
  const result = await query('SELECT * FROM event_packages WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createPackage(
  data: Omit<EventPackage, 'id' | 'is_active' | 'created_at'>
): Promise<EventPackage> {
  const sql = `
    INSERT INTO event_packages (name, name_ar, type, description, description_ar, base_price, max_guests, includes_decorations, includes_catering, duration_mins)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const params = [
    data.name,
    data.name_ar,
    data.type,
    data.description || null,
    data.description_ar || null,
    data.base_price,
    data.max_guests ?? null,
    data.includes_decorations ?? false,
    data.includes_catering ?? false,
    data.duration_mins,
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function updatePackage(
  id: string,
  data: Partial<Omit<EventPackage, 'id' | 'created_at'>>
): Promise<EventPackage | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'name', 'name_ar', 'type', 'description', 'description_ar',
    'base_price', 'max_guests', 'includes_decorations', 'includes_catering',
    'duration_mins', 'is_active',
  ];

  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) {
    return findPackageById(id);
  }

  params.push(id);
  const sql = `UPDATE event_packages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function findExtrasByBookingId(bookingId: string): Promise<EventExtras[]> {
  const sql = `
    SELECT * FROM event_extras
    WHERE booking_id = $1
    ORDER BY created_at ASC
  `;
  const result = await query(sql, [bookingId]);
  return result.rows;
}
