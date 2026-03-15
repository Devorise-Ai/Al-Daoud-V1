-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =====================
-- 1. COURTS
-- =====================
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,          -- '5v5', '7v7', '11v11'
  surface VARCHAR(50) NOT NULL,       -- 'artificial_grass', 'natural_grass'
  capacity INTEGER NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  peak_rate DECIMAL(10,2) NOT NULL,
  google_cal_id VARCHAR(255),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  maps_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 2. CUSTOMERS
-- =====================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200),
  email VARCHAR(255),
  preferred_lang VARCHAR(5) DEFAULT 'ar',
  segment VARCHAR(50) DEFAULT 'new',   -- 'new', 'occasional', 'regular', 'vip'
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  first_contact TIMESTAMPTZ DEFAULT NOW(),
  last_contact TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',       -- {preferred_court, preferred_time, team_size}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 3. BOOKINGS
-- =====================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  court_id UUID NOT NULL REFERENCES courts(id),
  booking_type VARCHAR(30) DEFAULT 'regular',  -- 'regular', 'birthday', 'private_event'
  status VARCHAR(20) DEFAULT 'confirmed',      -- 'confirmed', 'cancelled', 'completed', 'no_show'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_mins INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  google_event_id VARCHAR(255),
  cancel_token VARCHAR(100) UNIQUE,
  source VARCHAR(20) DEFAULT 'whatsapp',        -- 'whatsapp', 'voice', 'web', 'manual'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent double bookings at the database level
ALTER TABLE bookings ADD CONSTRAINT no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled');

-- =====================
-- 4. EVENT EXTRAS
-- =====================
CREATE TABLE event_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,       -- 'birthday', 'corporate', 'tournament'
  guest_count INTEGER,
  decorations BOOLEAN DEFAULT false,
  catering BOOLEAN DEFAULT false,
  special_requests TEXT,
  package_name VARCHAR(100),
  package_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 5. PRICING RULES
-- =====================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID REFERENCES courts(id),   -- NULL = applies to all courts
  day_of_week INTEGER,                    -- 0=Sun, 1=Mon...6=Sat, NULL = all days
  start_hour INTEGER NOT NULL,            -- 0-23
  end_hour INTEGER NOT NULL,              -- 0-23
  price DECIMAL(10,2) NOT NULL,
  is_peak BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 6. CONVERSATIONS
-- =====================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  channel VARCHAR(20) NOT NULL,           -- 'whatsapp', 'voice'
  status VARCHAR(20) DEFAULT 'active',    -- 'active', 'completed', 'abandoned'
  messages JSONB DEFAULT '[]',
  intent VARCHAR(50),                     -- 'booking', 'cancellation', 'inquiry', 'event'
  resolved BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- =====================
-- 7. ADMIN USERS
-- =====================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',       -- 'owner', 'manager', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- 8. EVENT PACKAGES
-- =====================
CREATE TABLE event_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,              -- 'birthday', 'corporate', 'tournament'
  description TEXT,
  description_ar TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  max_guests INTEGER,
  includes_decorations BOOLEAN DEFAULT false,
  includes_catering BOOLEAN DEFAULT false,
  duration_mins INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_bookings_court_time ON bookings(court_id, start_time, end_time);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_cancel_token ON bookings(cancel_token);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_pricing_rules_court ON pricing_rules(court_id);
