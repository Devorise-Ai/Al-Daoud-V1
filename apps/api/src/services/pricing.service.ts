import { query } from '../config/database';
import { PricingRule } from '../../../../packages/shared/src/types';
import { PEAK_START, PEAK_END, WEEKEND_DAYS } from '../../../../packages/shared/src/constants';

export interface PriceResult {
  price: number;
  is_peak: boolean;
}

/**
 * Get the price for a specific court and time slot.
 *
 * Priority:
 * 1. Court-specific pricing rule matching the day/hour with valid date range
 * 2. General pricing rule (no court_id) matching the day/hour with valid date range
 * 3. Court's own peak_rate / hourly_rate based on time-of-day and day-of-week
 */
export async function getPrice(courtId: string, startTime: Date | string): Promise<PriceResult> {
  const time = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const hour = time.getHours();
  const dayOfWeek = time.getDay(); // 0=Sunday .. 6=Saturday
  const dateStr = time.toISOString().split('T')[0];

  // Look for a court-specific pricing rule first, then a general one
  const sql = `
    SELECT * FROM pricing_rules
    WHERE
      (court_id = $1 OR court_id IS NULL)
      AND (day_of_week = $2 OR day_of_week IS NULL)
      AND start_hour <= $3
      AND end_hour > $3
      AND (valid_from IS NULL OR valid_from <= $4)
      AND (valid_until IS NULL OR valid_until >= $4)
    ORDER BY
      court_id IS NULL ASC,
      day_of_week IS NULL ASC
    LIMIT 1
  `;

  const result = await query(sql, [courtId, dayOfWeek, hour, dateStr]);

  if (result.rows.length > 0) {
    const rule: PricingRule = result.rows[0];
    return { price: Number(rule.price), is_peak: rule.is_peak };
  }

  // Fallback: use the court's own rates
  const courtResult = await query('SELECT hourly_rate, peak_rate FROM courts WHERE id = $1', [courtId]);
  if (courtResult.rows.length === 0) {
    throw new Error(`Court not found: ${courtId}`);
  }

  const court = courtResult.rows[0];
  const isPeak = isPeakTime(hour, dayOfWeek);

  return {
    price: Number(isPeak ? court.peak_rate : court.hourly_rate),
    is_peak: isPeak,
  };
}

function isPeakTime(hour: number, dayOfWeek: number): boolean {
  // Weekends are always peak
  if (WEEKEND_DAYS.includes(dayOfWeek)) {
    return true;
  }
  // Weekday evenings are peak
  return hour >= PEAK_START && hour < PEAK_END;
}
