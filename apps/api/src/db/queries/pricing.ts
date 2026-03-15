import { query } from '../../config/database';
import { PricingRule } from '../../../../../packages/shared/src/types';

export interface PricingRuleWithCourt extends PricingRule {
  court_name?: string;
}

export async function findAll(): Promise<PricingRuleWithCourt[]> {
  const sql = `
    SELECT pr.*, c.name AS court_name
    FROM pricing_rules pr
    LEFT JOIN courts c ON pr.court_id = c.id
    ORDER BY pr.start_hour ASC, pr.day_of_week ASC NULLS FIRST
  `;
  const result = await query(sql);
  return result.rows;
}

export async function findById(id: string): Promise<PricingRule | null> {
  const result = await query('SELECT * FROM pricing_rules WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(
  data: Omit<PricingRule, 'id' | 'created_at'>
): Promise<PricingRule> {
  const sql = `
    INSERT INTO pricing_rules (court_id, day_of_week, start_hour, end_hour, price, is_peak, valid_from, valid_until)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const params = [
    data.court_id || null,
    data.day_of_week ?? null,
    data.start_hour,
    data.end_hour,
    data.price,
    data.is_peak ?? false,
    data.valid_from || null,
    data.valid_until || null,
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function update(
  id: string,
  data: Partial<Omit<PricingRule, 'id' | 'created_at'>>
): Promise<PricingRule | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  const allowedFields = [
    'court_id', 'day_of_week', 'start_hour', 'end_hour',
    'price', 'is_peak', 'valid_from', 'valid_until',
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

  params.push(id);
  const sql = `UPDATE pricing_rules SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function deleteRule(id: string): Promise<boolean> {
  const result = await query('DELETE FROM pricing_rules WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
