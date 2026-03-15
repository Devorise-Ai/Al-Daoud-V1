import { z } from 'zod';
export declare const createBookingSchema: z.ZodObject<{
    customer_id: z.ZodString;
    court_id: z.ZodString;
    booking_type: z.ZodDefault<z.ZodEnum<["regular", "birthday", "private_event"]>>;
    start_time: z.ZodString;
    end_time: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<["whatsapp", "voice", "web", "manual"]>>;
}, "strip", z.ZodTypeAny, {
    customer_id: string;
    court_id: string;
    booking_type: "regular" | "birthday" | "private_event";
    start_time: string;
    end_time: string;
    source: "whatsapp" | "voice" | "web" | "manual";
    notes?: string | undefined;
}, {
    customer_id: string;
    court_id: string;
    start_time: string;
    end_time: string;
    booking_type?: "regular" | "birthday" | "private_event" | undefined;
    notes?: string | undefined;
    source?: "whatsapp" | "voice" | "web" | "manual" | undefined;
}>;
export declare const updateBookingSchema: z.ZodObject<{
    start_time: z.ZodOptional<z.ZodString>;
    end_time: z.ZodOptional<z.ZodString>;
    court_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["confirmed", "cancelled", "completed", "no_show"]>>;
    payment_status: z.ZodOptional<z.ZodEnum<["pending", "paid", "refunded"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    court_id?: string | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    notes?: string | undefined;
    status?: "confirmed" | "cancelled" | "completed" | "no_show" | undefined;
    payment_status?: "pending" | "paid" | "refunded" | undefined;
}, {
    court_id?: string | undefined;
    start_time?: string | undefined;
    end_time?: string | undefined;
    notes?: string | undefined;
    status?: "confirmed" | "cancelled" | "completed" | "no_show" | undefined;
    payment_status?: "pending" | "paid" | "refunded" | undefined;
}>;
export declare const courtSchema: z.ZodObject<{
    name: z.ZodString;
    name_ar: z.ZodString;
    type: z.ZodEnum<["5v5", "7v7", "11v11"]>;
    surface: z.ZodEnum<["artificial_grass", "natural_grass"]>;
    capacity: z.ZodNumber;
    hourly_rate: z.ZodNumber;
    peak_rate: z.ZodNumber;
    maps_link: z.ZodOptional<z.ZodString>;
    is_active: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "5v5" | "7v7" | "11v11";
    name: string;
    name_ar: string;
    surface: "artificial_grass" | "natural_grass";
    capacity: number;
    hourly_rate: number;
    peak_rate: number;
    maps_link?: string | undefined;
    is_active?: boolean | undefined;
}, {
    type: "5v5" | "7v7" | "11v11";
    name: string;
    name_ar: string;
    surface: "artificial_grass" | "natural_grass";
    capacity: number;
    hourly_rate: number;
    peak_rate: number;
    maps_link?: string | undefined;
    is_active?: boolean | undefined;
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    preferred_lang: z.ZodOptional<z.ZodEnum<["ar", "en"]>>;
    notes: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        preferred_court: z.ZodOptional<z.ZodString>;
        preferred_time: z.ZodOptional<z.ZodString>;
        team_size: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        preferred_court?: string | undefined;
        preferred_time?: string | undefined;
        team_size?: number | undefined;
    }, {
        preferred_court?: string | undefined;
        preferred_time?: string | undefined;
        team_size?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    preferred_lang?: "ar" | "en" | undefined;
    preferences?: {
        preferred_court?: string | undefined;
        preferred_time?: string | undefined;
        team_size?: number | undefined;
    } | undefined;
}, {
    notes?: string | undefined;
    name?: string | undefined;
    email?: string | undefined;
    preferred_lang?: "ar" | "en" | undefined;
    preferences?: {
        preferred_court?: string | undefined;
        preferred_time?: string | undefined;
        team_size?: number | undefined;
    } | undefined;
}>;
export declare const availabilityQuerySchema: z.ZodObject<{
    court_id: z.ZodOptional<z.ZodString>;
    date: z.ZodString;
    duration: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    date: string;
    duration: number;
    court_id?: string | undefined;
}, {
    date: string;
    court_id?: string | undefined;
    duration?: number | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const pricingRuleSchema: z.ZodObject<{
    court_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    day_of_week: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    start_hour: z.ZodNumber;
    end_hour: z.ZodNumber;
    price: z.ZodNumber;
    is_peak: z.ZodDefault<z.ZodBoolean>;
    valid_from: z.ZodOptional<z.ZodString>;
    valid_until: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    start_hour: number;
    end_hour: number;
    price: number;
    is_peak: boolean;
    court_id?: string | null | undefined;
    day_of_week?: number | null | undefined;
    valid_from?: string | undefined;
    valid_until?: string | undefined;
}, {
    start_hour: number;
    end_hour: number;
    price: number;
    court_id?: string | null | undefined;
    day_of_week?: number | null | undefined;
    is_peak?: boolean | undefined;
    valid_from?: string | undefined;
    valid_until?: string | undefined;
}>;
