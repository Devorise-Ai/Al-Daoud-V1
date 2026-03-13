// Court types
export interface Court {
  id: string;
  name: string;
  name_ar: string;
  type: '5v5' | '7v7' | '11v11';
  surface: 'artificial_grass' | 'natural_grass';
  capacity: number;
  hourly_rate: number;
  peak_rate: number;
  google_cal_id?: string;
  location_lat?: number;
  location_lng?: number;
  maps_link?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Customer types
export type CustomerSegment = 'new' | 'occasional' | 'regular' | 'vip';

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  preferred_lang: 'ar' | 'en';
  segment: CustomerSegment;
  total_bookings: number;
  total_spent: number;
  first_contact: string;
  last_contact: string;
  preferences: CustomerPreferences;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerPreferences {
  preferred_court?: string;
  preferred_time?: string;
  team_size?: number;
}

// Booking types
export type BookingType = 'regular' | 'birthday' | 'private_event';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type BookingSource = 'whatsapp' | 'voice' | 'web' | 'manual';

export interface Booking {
  id: string;
  customer_id: string;
  court_id: string;
  booking_type: BookingType;
  status: BookingStatus;
  start_time: string;
  end_time: string;
  duration_mins: number;
  price: number;
  discount: number;
  payment_status: PaymentStatus;
  google_event_id?: string;
  cancel_token?: string;
  source: BookingSource;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Event extras
export interface EventExtras {
  id: string;
  booking_id: string;
  event_type: 'birthday' | 'corporate' | 'tournament';
  guest_count?: number;
  decorations: boolean;
  catering: boolean;
  special_requests?: string;
  package_name?: string;
  package_price?: number;
  created_at: string;
}

// Event packages
export interface EventPackage {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  description?: string;
  description_ar?: string;
  base_price: number;
  max_guests?: number;
  includes_decorations: boolean;
  includes_catering: boolean;
  duration_mins: number;
  is_active: boolean;
  created_at: string;
}

// Pricing rules
export interface PricingRule {
  id: string;
  court_id?: string;
  day_of_week?: number;
  start_hour: number;
  end_hour: number;
  price: number;
  is_peak: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
}

// Conversation
export type ConversationChannel = 'whatsapp' | 'voice';
export type ConversationIntent = 'booking' | 'cancellation' | 'inquiry' | 'event';

export interface Conversation {
  id: string;
  customer_id?: string;
  channel: ConversationChannel;
  status: 'active' | 'completed' | 'abandoned';
  messages: ConversationMessage[];
  intent?: ConversationIntent;
  resolved: boolean;
  started_at: string;
  ended_at?: string;
}

export interface ConversationMessage {
  role: 'customer' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Admin user
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API response types
export interface TimeSlot {
  start_time: string;
  end_time: string;
  court_id: string;
  court_name: string;
  price: number;
  is_peak: boolean;
  available: boolean;
}

export interface DashboardStats {
  today_bookings: number;
  today_revenue: number;
  week_bookings: number;
  week_revenue: number;
  month_bookings: number;
  month_revenue: number;
  active_conversations: number;
}
