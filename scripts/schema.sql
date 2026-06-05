-- HamroHisab — Supabase Database Schema v2
-- Run this in the Supabase SQL Editor for your project

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE companies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text UNIQUE,
  logo_url              text,
  address               text,
  gst_number            text,
  contact_number        text,
  contact_email         text,
  currency              text DEFAULT 'INR',
  timezone              text DEFAULT 'Asia/Kolkata',
  joining_date          date DEFAULT CURRENT_DATE,
  subscription_start    date,
  subscription_end      date,
  subscription_status   text DEFAULT 'active'
    CHECK (subscription_status IN ('active','trial','paused','expired')),
  company_status        text DEFAULT 'active'
    CHECK (company_status IN ('active','paused','disabled','expired')),
  plan                  text DEFAULT 'starter'
    CHECK (plan IN ('free','starter','pro','enterprise')),
  created_at            timestamptz DEFAULT now()
);

-- Super Admin profile (platform owner, not company-scoped)
CREATE TABLE superadmin (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text,
  email          text UNIQUE,
  contact_number text,
  avatar_url     text,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name   text,
  role        text CHECK (role IN ('admin','operator')) NOT NULL,
  email       text,
  avatar_url  text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES categories(id) ON DELETE SET NULL,
  name        text NOT NULL,
  slug        text,
  level       integer DEFAULT 0,
  color       text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE products (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               uuid REFERENCES companies(id) ON DELETE CASCADE,
  category_id              uuid REFERENCES categories(id) ON DELETE SET NULL,
  name                     text NOT NULL,
  sku                      text,
  barcode                  text,
  purchase_price           numeric(12,2) DEFAULT 0,
  selling_price            numeric(12,2) DEFAULT 0,
  quantity                 integer DEFAULT 0,
  min_stock                integer DEFAULT 10,
  is_active                boolean DEFAULT true,
  manufacture_date         date,
  expiration_date          date,
  expiry_notification_days integer DEFAULT 30,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE TABLE sales (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  operator_id    uuid REFERENCES users(id),
  invoice_number text,
  customer_name  text,
  subtotal       numeric(12,2) DEFAULT 0,
  discount       numeric(12,2) DEFAULT 0,
  tax_rate       numeric(5,2) DEFAULT 18,
  tax_amount     numeric(12,2) DEFAULT 0,
  grand_total    numeric(12,2) DEFAULT 0,
  payment_method text CHECK (payment_method IN ('cash','upi','card','bank_transfer')),
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE sale_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      uuid REFERENCES sales(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES products(id),
  product_name text,
  quantity     integer,
  unit_price   numeric(12,2),
  discount     numeric(12,2) DEFAULT 0,
  line_total   numeric(12,2)
);

CREATE TABLE purchases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  operator_id    uuid REFERENCES users(id),
  supplier_name  text,
  product_id     uuid REFERENCES products(id),
  product_name   text,
  quantity       integer,
  unit_cost      numeric(12,2),
  total_cost     numeric(12,2),
  invoice_number text,
  payment_method text CHECK (payment_method IN ('cash','upi','card','bank_transfer')),
  notes          text,
  purchased_at   timestamptz DEFAULT now()
);

CREATE TABLE expenses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  operator_id    uuid REFERENCES users(id),
  category       text CHECK (category IN ('rent','salary','electricity','transport','marketing','maintenance','other')),
  description    text,
  amount         numeric(12,2),
  payment_method text CHECK (payment_method IN ('cash','upi','card','bank_transfer')),
  reference_note text,
  expense_date   date,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid REFERENCES companies(id) ON DELETE CASCADE,
  sale_id        uuid REFERENCES sales(id) ON DELETE CASCADE,
  invoice_number text UNIQUE,
  pdf_url        text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
  type        text CHECK (type IN ('alert','info','warning','success')),
  title       text,
  message     text,
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Subscription renewal log (written by superadmin only)
CREATE TABLE subscription_renewals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
  plan        text CHECK (plan IN ('free','starter','pro','enterprise')),
  start_date  date,
  end_date    date,
  amount      numeric(12,2),
  renewed_by  text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_products_company       ON products(company_id);
CREATE INDEX idx_products_category      ON products(category_id);
CREATE INDEX idx_products_expiry        ON products(company_id, expiration_date)
  WHERE is_active = true AND expiration_date IS NOT NULL;
CREATE INDEX idx_sales_company_date     ON sales(company_id, created_at DESC);
CREATE INDEX idx_sales_operator         ON sales(operator_id);
CREATE INDEX idx_purchases_company      ON purchases(company_id, purchased_at DESC);
CREATE INDEX idx_expenses_company       ON expenses(company_id, expense_date DESC);
CREATE INDEX idx_sale_items_sale        ON sale_items(sale_id);
CREATE INDEX idx_categories_parent      ON categories(parent_id);
CREATE INDEX idx_categories_company     ON categories(company_id);
CREATE INDEX idx_companies_status       ON companies(company_status);
CREATE INDEX idx_companies_sub_end      ON companies(subscription_end);
CREATE INDEX idx_renewals_company       ON subscription_renewals(company_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE superadmin            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_renewals ENABLE ROW LEVEL SECURITY;

-- Helper: get calling user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$;

-- Helper: get calling user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- companies: user can read their own company
CREATE POLICY "users_read_own_company" ON companies
  FOR SELECT USING (id = get_user_company_id());

-- users: can read members of same company
CREATE POLICY "users_read_same_company" ON users
  FOR SELECT USING (company_id = get_user_company_id());

-- superadmin: can only read/update their own profile
CREATE POLICY "superadmin_own_profile" ON superadmin
  USING (id = auth.uid());

-- Generic company isolation for all data tables
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','sales','purchases','expenses','invoices','notifications']
  LOOP
    EXECUTE format('
      CREATE POLICY "company_isolation" ON %I
        USING (company_id = get_user_company_id());
    ', t);
  END LOOP;
END $$;

-- sale_items: access via parent sale
CREATE POLICY "sale_items_access" ON sale_items
  USING (sale_id IN (
    SELECT id FROM sales WHERE company_id = get_user_company_id()
  ));

-- subscription_renewals: read-only for company users (written by superadmin via service_role)
CREATE POLICY "renewals_read_own" ON subscription_renewals
  FOR SELECT USING (company_id = get_user_company_id());

-- Operator write access
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['products','sales','purchases','expenses','invoices','categories']
  LOOP
    EXECUTE format('
      CREATE POLICY "operator_insert" ON %I FOR INSERT
        WITH CHECK (company_id = get_user_company_id());
    ', t);
  END LOOP;
END $$;

CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT
  WITH CHECK (sale_id IN (
    SELECT id FROM sales WHERE company_id = get_user_company_id()
  ));

CREATE POLICY "operator_update_products" ON products FOR UPDATE
  USING (company_id = get_user_company_id() AND get_user_role() = 'operator');

CREATE POLICY "operator_delete_products" ON products FOR DELETE
  USING (company_id = get_user_company_id() AND get_user_role() = 'operator');

CREATE POLICY "operator_update_categories" ON categories FOR UPDATE
  USING (company_id = get_user_company_id() AND get_user_role() = 'operator');
CREATE POLICY "operator_delete_categories" ON categories FOR DELETE
  USING (company_id = get_user_company_id() AND get_user_role() = 'operator');

CREATE POLICY "users_update_notifications" ON notifications FOR UPDATE
  USING (company_id = get_user_company_id());

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION adjust_product_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'sale_items' AND TG_OP = 'INSERT' THEN
    UPDATE products SET quantity = quantity - NEW.quantity WHERE id = NEW.product_id;
  ELSIF TG_TABLE_NAME = 'purchases' AND TG_OP = 'INSERT' THEN
    UPDATE products SET quantity = quantity + NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sale_items_decrement_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION adjust_product_stock();

CREATE TRIGGER purchases_increment_stock
  AFTER INSERT ON purchases
  FOR EACH ROW EXECUTE FUNCTION adjust_product_stock();

CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quantity <= NEW.min_stock AND OLD.quantity > OLD.min_stock THEN
    INSERT INTO notifications (company_id, type, title, message)
    VALUES (
      NEW.company_id, 'alert',
      'Low stock alert — ' || NEW.name,
      'Only ' || NEW.quantity || ' units remaining. Minimum stock level is ' || NEW.min_stock || '.'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_low_stock_notify
  AFTER UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- ============================================================
-- EXPIRY NOTIFICATION FUNCTION (scheduled via pg_cron)
-- ============================================================
-- Enable pg_cron extension in Supabase Dashboard → Extensions, then:
-- SELECT cron.schedule('daily-expiry-check', '0 8 * * *', 'SELECT generate_expiry_notifications()');

CREATE OR REPLACE FUNCTION generate_expiry_notifications()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE inserted integer;
BEGIN
  INSERT INTO notifications (company_id, type, title, message)
  SELECT
    p.company_id,
    CASE WHEN p.expiration_date <= CURRENT_DATE THEN 'alert' ELSE 'warning' END,
    CASE
      WHEN p.expiration_date <= CURRENT_DATE THEN 'Expired — ' || p.name
      ELSE 'Expiring in ' || (p.expiration_date - CURRENT_DATE)::text || ' days — ' || p.name
    END,
    CASE
      WHEN p.expiration_date <= CURRENT_DATE
        THEN p.name || ' expired on ' || to_char(p.expiration_date, 'DD Mon YYYY') || '. Remove from inventory immediately.'
      ELSE p.name || ' will expire on ' || to_char(p.expiration_date, 'DD Mon YYYY') ||
           ' (' || (p.expiration_date - CURRENT_DATE)::text || ' days remaining).'
    END
  FROM products p
  WHERE p.is_active = true
    AND p.expiration_date IS NOT NULL
    AND p.expiration_date <= CURRENT_DATE + make_interval(days => COALESCE(p.expiry_notification_days, 30))
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.company_id = p.company_id
        AND n.title LIKE '% — ' || p.name
        AND n.created_at::date = CURRENT_DATE
    );
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
