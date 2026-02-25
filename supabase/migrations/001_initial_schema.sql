-- ═══════════════════════════════════════════════════════════════════════════
-- TROLLEY · Supabase Database Schema
-- Migration: 001_initial_schema.sql
-- Run via: supabase db push  OR paste into Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('customer', 'restaurant_admin', 'driver', 'operator');
CREATE TYPE order_status AS ENUM (
  'payment_pending',
  'placed',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'on_the_way',
  'delivered',
  'cancelled'
);
CREATE TYPE payment_method AS ENUM ('mtn_momo', 'card');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE city_zone AS ENUM ('Mbabane', 'Manzini', 'Other');

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES
-- Extends Supabase auth.users. Created automatically via trigger on signup.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'customer',
  full_name   TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- DELIVERY ZONES
-- Flat fee per geographic zone. Managed by operator.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE delivery_zones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          city_zone NOT NULL UNIQUE,
  flat_fee_szl  NUMERIC(8,2) NOT NULL DEFAULT 15.00,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the three zones
INSERT INTO delivery_zones (name, flat_fee_szl) VALUES
  ('Mbabane', 15.00),
  ('Manzini', 15.00),
  ('Other',   25.00);

-- ═══════════════════════════════════════════════════════════════════════════
-- RESTAURANTS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE restaurants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,   -- URL-safe identifier e.g. "swati-braai-house"
  description       TEXT,
  cuisine_type      TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT NOT NULL,
  address           TEXT NOT NULL,
  zone              city_zone NOT NULL DEFAULT 'Mbabane',
  cover_image_url   TEXT,
  logo_url          TEXT,
  emoji             TEXT NOT NULL DEFAULT '🍽️',
  is_open           BOOLEAN NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,  -- operator toggle
  min_order_szl     NUMERIC(8,2) NOT NULL DEFAULT 0,
  estimated_delivery_min INTEGER NOT NULL DEFAULT 30,  -- lower bound for display
  estimated_delivery_max INTEGER NOT NULL DEFAULT 45,  -- upper bound for display
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link table: which profile (restaurant_admin role) manages which restaurant
CREATE TABLE restaurant_admins (
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, restaurant_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU CATEGORIES & ITEMS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,  -- denormalised for easier querying
  name          TEXT NOT NULL,
  description   TEXT,
  price_szl     NUMERIC(8,2) NOT NULL,
  emoji         TEXT DEFAULT '🍽️',
  image_url     TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- DRIVERS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE drivers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  zone        city_zone NOT NULL DEFAULT 'Mbabane',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Readable reference shown to customer/driver e.g. "ORD-A4K2X"
  ref                 TEXT NOT NULL UNIQUE DEFAULT 'ORD-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 5)),
  customer_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL for guest checkout
  restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
  driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status              order_status NOT NULL DEFAULT 'payment_pending',
  -- Financials (snapshot at time of order — never recalculated)
  subtotal_szl        NUMERIC(10,2) NOT NULL,
  delivery_fee_szl    NUMERIC(10,2) NOT NULL,
  total_szl           NUMERIC(10,2) NOT NULL,
  -- Delivery info
  delivery_address    TEXT NOT NULL,
  delivery_phone      TEXT NOT NULL,
  delivery_zone       city_zone NOT NULL DEFAULT 'Mbabane',
  -- Payment
  payment_method      payment_method NOT NULL DEFAULT 'mtn_momo',
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  payment_ref         TEXT,  -- Reference from Peach Payments / MTN MoMo
  -- Rejection
  rejection_reason    TEXT,
  -- Guest checkout (no account)
  guest_name          TEXT,
  -- Timestamps
  placed_at           TIMESTAMPTZ,  -- Set when payment confirmed
  confirmed_at        TIMESTAMPTZ,
  preparing_at        TIMESTAMPTZ,
  ready_at            TIMESTAMPTZ,
  picked_up_at        TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ORDER ITEMS
-- Snapshot of menu item at time of order — critical per PRD section 6.2
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE order_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id          UUID REFERENCES menu_items(id) ON DELETE SET NULL,  -- may be null if item deleted
  -- Snapshot fields: preserve the order state even if menu item is later edited/deleted
  item_name_snapshot    TEXT NOT NULL,
  item_price_snapshot   NUMERIC(8,2) NOT NULL,
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  line_total_szl        NUMERIC(10,2) NOT NULL GENERATED ALWAYS AS (item_price_snapshot * quantity) STORED,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_orders_restaurant_id    ON orders(restaurant_id);
CREATE INDEX idx_orders_customer_id      ON orders(customer_id);
CREATE INDEX idx_orders_driver_id        ON orders(driver_id);
CREATE INDEX idx_orders_status           ON orders(status);
CREATE INDEX idx_orders_placed_at        ON orders(placed_at DESC);
CREATE INDEX idx_menu_items_restaurant   ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category     ON menu_items(category_id);
CREATE INDEX idx_order_items_order       ON order_items(order_id);
CREATE INDEX idx_restaurants_zone        ON restaurants(zone);
CREATE INDEX idx_restaurants_is_active   ON restaurants(is_active);
CREATE INDEX idx_restaurants_slug        ON restaurants(slug);

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- Auto-update updated_at on any row change
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_delivery_zones_updated_at
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- ORDER STATUS TIMESTAMP TRIGGER
-- Automatically stamps the correct timestamp column when status changes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION stamp_order_status_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    CASE NEW.status
      WHEN 'placed'           THEN NEW.placed_at      = NOW();
      WHEN 'confirmed'        THEN NEW.confirmed_at   = NOW();
      WHEN 'preparing'        THEN NEW.preparing_at   = NOW();
      WHEN 'ready_for_pickup' THEN NEW.ready_at       = NOW();
      WHEN 'on_the_way'       THEN NEW.picked_up_at   = NOW();
      WHEN 'delivered'        THEN NEW.delivered_at   = NOW();
      WHEN 'cancelled'        THEN NEW.cancelled_at   = NOW();
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION stamp_order_status_time();

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones    ENABLE ROW LEVEL SECURITY;

-- ── Helper function: get current user's role ──────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: is current user a restaurant admin for a given restaurant? ────
CREATE OR REPLACE FUNCTION is_restaurant_admin_for(restaurant_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurant_admins
    WHERE profile_id = auth.uid() AND restaurant_id = restaurant_uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Helper: is current user the driver assigned to an order? ─────────────
CREATE OR REPLACE FUNCTION is_assigned_driver_for(order_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN drivers d ON d.id = o.driver_id
    WHERE o.id = order_uuid AND d.profile_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── PROFILES policies ─────────────────────────────────────────────────────
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Operators can read all profiles"
  ON profiles FOR SELECT
  USING (current_user_role() = 'operator');

-- ── RESTAURANTS policies ──────────────────────────────────────────────────
-- Anyone can browse active restaurants
CREATE POLICY "Public can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = TRUE);

-- Restaurant admin can view their own restaurant even if inactive
CREATE POLICY "Restaurant admins can view their restaurant"
  ON restaurants FOR SELECT
  USING (is_restaurant_admin_for(id));

-- Restaurant admin can update their own restaurant (e.g. is_open toggle)
CREATE POLICY "Restaurant admins can update their restaurant"
  ON restaurants FOR UPDATE
  USING (is_restaurant_admin_for(id))
  WITH CHECK (is_restaurant_admin_for(id));

-- Operators have full control
CREATE POLICY "Operators have full access to restaurants"
  ON restaurants FOR ALL
  USING (current_user_role() = 'operator');

-- ── MENU CATEGORIES policies ──────────────────────────────────────────────
CREATE POLICY "Public can read menu categories"
  ON menu_categories FOR SELECT USING (TRUE);

CREATE POLICY "Restaurant admins can manage their categories"
  ON menu_categories FOR ALL
  USING (is_restaurant_admin_for(restaurant_id));

CREATE POLICY "Operators can manage all categories"
  ON menu_categories FOR ALL
  USING (current_user_role() = 'operator');

-- ── MENU ITEMS policies ───────────────────────────────────────────────────
CREATE POLICY "Public can read available menu items"
  ON menu_items FOR SELECT
  USING (is_available = TRUE);

CREATE POLICY "Restaurant admins can see all their items incl unavailable"
  ON menu_items FOR SELECT
  USING (is_restaurant_admin_for(restaurant_id));

CREATE POLICY "Restaurant admins can manage their menu items"
  ON menu_items FOR ALL
  USING (is_restaurant_admin_for(restaurant_id));

CREATE POLICY "Operators can manage all menu items"
  ON menu_items FOR ALL
  USING (current_user_role() = 'operator');

-- ── DELIVERY ZONES policies ───────────────────────────────────────────────
CREATE POLICY "Public can read delivery zones"
  ON delivery_zones FOR SELECT USING (TRUE);

CREATE POLICY "Only operators can modify zones"
  ON delivery_zones FOR ALL
  USING (current_user_role() = 'operator');

-- ── DRIVERS policies ──────────────────────────────────────────────────────
CREATE POLICY "Drivers can see their own record"
  ON drivers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Operators can manage all drivers"
  ON drivers FOR ALL
  USING (current_user_role() = 'operator');

-- ── ORDERS policies ───────────────────────────────────────────────────────
-- Customers see only their own orders
CREATE POLICY "Customers can read their own orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

-- Customers can create orders (payment_pending state only)
CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  WITH CHECK (status = 'payment_pending');

-- Restaurant admins see orders for their restaurant
CREATE POLICY "Restaurant admins can view their orders"
  ON orders FOR SELECT
  USING (is_restaurant_admin_for(restaurant_id));

-- Restaurant admins can update order status (accept/reject/ready)
CREATE POLICY "Restaurant admins can update order status"
  ON orders FOR UPDATE
  USING (is_restaurant_admin_for(restaurant_id))
  WITH CHECK (is_restaurant_admin_for(restaurant_id));

-- Drivers can see their assigned orders
CREATE POLICY "Drivers can view their assigned orders"
  ON orders FOR SELECT
  USING (is_assigned_driver_for(id));

-- Drivers can update status of their assigned orders (picked_up, delivered)
CREATE POLICY "Drivers can update their assigned orders"
  ON orders FOR UPDATE
  USING (is_assigned_driver_for(id));

-- Operators see everything
CREATE POLICY "Operators have full access to orders"
  ON orders FOR ALL
  USING (current_user_role() = 'operator');

-- ── ORDER ITEMS policies ──────────────────────────────────────────────────
CREATE POLICY "Order item visibility mirrors order visibility"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND (
        o.customer_id = auth.uid()
        OR is_restaurant_admin_for(o.restaurant_id)
        OR is_assigned_driver_for(o.id)
        OR current_user_role() = 'operator'
      )
    )
  );

CREATE POLICY "Customers can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND o.customer_id = auth.uid()
    )
  );

-- ── RESTAURANT ADMINS link table ──────────────────────────────────────────
CREATE POLICY "Operators manage restaurant admin assignments"
  ON restaurant_admins FOR ALL
  USING (current_user_role() = 'operator');

CREATE POLICY "Restaurant admins can view their own assignment"
  ON restaurant_admins FOR SELECT
  USING (profile_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS (useful for operator dashboard and reporting)
-- ═══════════════════════════════════════════════════════════════════════════

-- Orders with enriched restaurant + driver + customer info
CREATE OR REPLACE VIEW orders_enriched AS
SELECT
  o.*,
  r.name         AS restaurant_name,
  r.emoji        AS restaurant_emoji,
  d.name         AS driver_name,
  d.phone        AS driver_phone,
  p.full_name    AS customer_name,
  p.phone        AS customer_phone_profile
FROM orders o
JOIN  restaurants r ON r.id = o.restaurant_id
LEFT JOIN drivers   d ON d.id = o.driver_id
LEFT JOIN profiles  p ON p.id = o.customer_id;

-- Daily GMV summary per restaurant (used by operator revenue dashboard)
CREATE OR REPLACE VIEW daily_gmv_by_restaurant AS
SELECT
  r.id             AS restaurant_id,
  r.name           AS restaurant_name,
  r.emoji,
  DATE(o.placed_at) AS order_date,
  COUNT(o.id)       AS order_count,
  SUM(o.subtotal_szl) AS gmv_szl,
  SUM(o.subtotal_szl) * 0.10 AS platform_fee_szl
FROM orders o
JOIN restaurants r ON r.id = o.restaurant_id
WHERE o.status = 'delivered'
GROUP BY r.id, r.name, r.emoji, DATE(o.placed_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- REALTIME
-- Enable Supabase Realtime on the orders table so restaurant portal
-- and driver view receive live updates without polling.
-- Run these in the Supabase dashboard → Database → Replication
-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
-- (Uncomment and run separately in Supabase SQL editor)
