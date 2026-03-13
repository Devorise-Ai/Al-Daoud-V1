import { z } from 'zod';

// Booking creation
export const createBookingSchema = z.object({
  customer_id: z.string().uuid(),
  court_id: z.string().uuid(),
  booking_type: z.enum(['regular', 'birthday', 'private_event']).default('regular'),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  notes: z.string().optional(),
  source: z.enum(['whatsapp', 'voice', 'web', 'manual']).default('manual'),
});

// Booking modification
export const updateBookingSchema = z.object({
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  court_id: z.string().uuid().optional(),
  status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  payment_status: z.enum(['pending', 'paid', 'refunded']).optional(),
  notes: z.string().optional(),
});

// Court creation/update
export const courtSchema = z.object({
  name: z.string().min(1).max(100),
  name_ar: z.string().min(1).max(100),
  type: z.enum(['5v5', '7v7', '11v11']),
  surface: z.enum(['artificial_grass', 'natural_grass']),
  capacity: z.number().int().positive(),
  hourly_rate: z.number().positive(),
  peak_rate: z.number().positive(),
  maps_link: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

// Customer update
export const updateCustomerSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  preferred_lang: z.enum(['ar', 'en']).optional(),
  notes: z.string().optional(),
  preferences: z.object({
    preferred_court: z.string().optional(),
    preferred_time: z.string().optional(),
    team_size: z.number().optional(),
  }).optional(),
});

// Availability query
export const availabilityQuerySchema = z.object({
  court_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.number().int().positive().default(60),
});

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Pricing rule
export const pricingRuleSchema = z.object({
  court_id: z.string().uuid().nullable().optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  start_hour: z.number().int().min(0).max(23),
  end_hour: z.number().int().min(1).max(24),
  price: z.number().positive(),
  is_peak: z.boolean().default(false),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});
