"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingRuleSchema = exports.loginSchema = exports.availabilityQuerySchema = exports.updateCustomerSchema = exports.courtSchema = exports.updateBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
// Booking creation
exports.createBookingSchema = zod_1.z.object({
    customer_id: zod_1.z.string().uuid(),
    court_id: zod_1.z.string().uuid(),
    booking_type: zod_1.z.enum(['regular', 'birthday', 'private_event']).default('regular'),
    start_time: zod_1.z.string().datetime(),
    end_time: zod_1.z.string().datetime(),
    notes: zod_1.z.string().optional(),
    source: zod_1.z.enum(['whatsapp', 'voice', 'web', 'manual']).default('manual'),
});
// Booking modification
exports.updateBookingSchema = zod_1.z.object({
    start_time: zod_1.z.string().datetime().optional(),
    end_time: zod_1.z.string().datetime().optional(),
    court_id: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
    payment_status: zod_1.z.enum(['pending', 'paid', 'refunded']).optional(),
    notes: zod_1.z.string().optional(),
});
// Court creation/update
exports.courtSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    name_ar: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['5v5', '7v7', '11v11']),
    surface: zod_1.z.enum(['artificial_grass', 'natural_grass']),
    capacity: zod_1.z.number().int().positive(),
    hourly_rate: zod_1.z.number().positive(),
    peak_rate: zod_1.z.number().positive(),
    maps_link: zod_1.z.string().url().optional(),
    is_active: zod_1.z.boolean().optional(),
});
// Customer update
exports.updateCustomerSchema = zod_1.z.object({
    name: zod_1.z.string().max(200).optional(),
    email: zod_1.z.string().email().optional(),
    preferred_lang: zod_1.z.enum(['ar', 'en']).optional(),
    notes: zod_1.z.string().optional(),
    preferences: zod_1.z.object({
        preferred_court: zod_1.z.string().optional(),
        preferred_time: zod_1.z.string().optional(),
        team_size: zod_1.z.number().optional(),
    }).optional(),
});
// Availability query
exports.availabilityQuerySchema = zod_1.z.object({
    court_id: zod_1.z.string().uuid().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration: zod_1.z.number().int().positive().default(60),
});
// Auth
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
// Pricing rule
exports.pricingRuleSchema = zod_1.z.object({
    court_id: zod_1.z.string().uuid().nullable().optional(),
    day_of_week: zod_1.z.number().int().min(0).max(6).nullable().optional(),
    start_hour: zod_1.z.number().int().min(0).max(23),
    end_hour: zod_1.z.number().int().min(1).max(24),
    price: zod_1.z.number().positive(),
    is_peak: zod_1.z.boolean().default(false),
    valid_from: zod_1.z.string().optional(),
    valid_until: zod_1.z.string().optional(),
});
