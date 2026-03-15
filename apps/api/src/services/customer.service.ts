import * as customerQueries from '../db/queries/customers';
import { updateCustomerSchema } from '../../../../packages/shared/src/validation';
import { SEGMENT_THRESHOLDS } from '../../../../packages/shared/src/constants';
import type { CustomerSegment } from '../../../../packages/shared/src/types';

interface ServiceError extends Error {
  code?: string;
}

function createError(message: string, code: string): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  return error;
}

/**
 * List customers with optional filters and pagination.
 */
export async function getCustomers(filters: Record<string, any>) {
  return customerQueries.findAll(filters);
}

/**
 * Get a single customer by ID. Throws if not found.
 */
export async function getCustomerById(id: string) {
  const customer = await customerQueries.findById(id);
  if (!customer) {
    throw createError('Customer not found', 'NOT_FOUND');
  }
  return customer;
}

/**
 * Validate and update a customer's profile fields.
 */
export async function updateCustomer(id: string, data: Record<string, any>) {
  // Ensure customer exists
  const existing = await customerQueries.findById(id);
  if (!existing) {
    throw createError('Customer not found', 'NOT_FOUND');
  }

  // Validate input
  const parsed = updateCustomerSchema.safeParse(data);
  if (!parsed.success) {
    const error = createError('Validation failed', 'VALIDATION_ERROR') as any;
    error.details = parsed.error.flatten().fieldErrors;
    throw error;
  }

  const updated = await customerQueries.update(id, parsed.data);
  return updated;
}

/**
 * Get a customer's booking history.
 */
export async function getCustomerBookings(customerId: string) {
  // Ensure customer exists
  const customer = await customerQueries.findById(customerId);
  if (!customer) {
    throw createError('Customer not found', 'NOT_FOUND');
  }

  return customerQueries.getBookingHistory(customerId);
}

/**
 * Return aggregate segment statistics: count and percentage per segment.
 */
export async function getSegmentStats() {
  const segmentRows = await customerQueries.getSegmentCounts();

  const segmentMap: Record<string, number> = {
    new: 0,
    occasional: 0,
    regular: 0,
    vip: 0,
  };

  for (const row of segmentRows) {
    if (row.segment in segmentMap) {
      segmentMap[row.segment] = row.count;
    }
  }

  const total = Object.values(segmentMap).reduce((sum, count) => sum + count, 0);

  const segments = Object.entries(segmentMap).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
  }));

  return { segments, total };
}

/**
 * Recalculate and update a customer's segment based on their total_bookings.
 */
export async function recalculateSegment(customerId: string) {
  const customer = await customerQueries.findById(customerId);
  if (!customer) {
    throw createError('Customer not found', 'NOT_FOUND');
  }

  const totalBookings = customer.total_bookings;
  let newSegment: CustomerSegment = 'new';

  for (const [segment, thresholds] of Object.entries(SEGMENT_THRESHOLDS)) {
    if (totalBookings >= thresholds.min && totalBookings <= thresholds.max) {
      newSegment = segment as CustomerSegment;
      break;
    }
  }

  if (newSegment !== customer.segment) {
    return customerQueries.updateSegment(customerId, newSegment);
  }

  return customer;
}
