-- HamroHisab — Production Schema
-- Paste into Supabase SQL Editor and click Run

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('admin','operator','superadmin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.company_status AS ENUM ('active','paused','disabled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('active','trial','paused','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.plan_type AS ENUM ('free','starter','pro','enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('cash','upi','card','bank_transfer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.expense_category AS ENUM ('rent','salary','electricity','transport','marketing','maintenance','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('alert','info','warning','success'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.audit_action AS ENUM ('INSERT','UPDATE','DELETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE,
  logo_url            TEXT,
  address             TEXT,
  gst_number          TEXT,
  contact_number      TEXT,
  contact_email       TEXT,
  currency            TEXT NOT NULL DEFAULT 'INR',
  timezone            TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  joining_date        DATE,
  subscription_start  DATE,
  subscription_end    DATE,
  subscription_status public.subscription_status NOT NULL DEFAULT 'trial',
  company_status      public.company_status NOT NULL DEFAULT 'active',
  plan                public.plan_type NOT NULL DEFAULT 'free',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  role       public.user_role NOT NULL DEFAULT 'operator',
  email      TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.superadmin (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  contact_number TEXT,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT,
  parent_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level      INTEGER NOT NULL DEFAULT 0,
  color      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, slug)
);

CREATE TABLE IF NOT EXISTS public.products (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id               UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id              UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name                     TEXT NOT NULL,
  sku                      TEXT NOT NULL,
  barcode                  TEXT,
  purchase_price           NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price            NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  quantity                 INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock                INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  is_active                BOOLEAN NOT NULL DEFAULT true,
  manufacture_date         DATE,
  expiration_date          DATE,
  expiry_notification_days INTEGER,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);

CREATE TABLE IF NOT EXISTS public.sales (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  customer_name  TEXT,
  subtotal       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  tax_rate       NUMERIC(5,2) NOT NULL DEFAULT 18 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  grand_total    NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  payment_method public.payment_method NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id      UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  discount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  line_total   NUMERIC(14,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  supplier_name  TEXT NOT NULL,
  product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name   TEXT NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost      NUMERIC(14,2) NOT NULL CHECK (unit_cost >= 0),
  total_cost     NUMERIC(14,2) NOT NULL CHECK (total_cost >= 0),
  invoice_number TEXT,
  payment_method public.payment_method NOT NULL,
  notes          TEXT,
  purchased_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operator_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category       public.expense_category NOT NULL,
  description    TEXT NOT NULL,
  amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_method public.payment_method NOT NULL,
  reference_note TEXT,
  expense_date   DATE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type       public.notification_type NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_renewals (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan       public.plan_type NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL CHECK (end_date >= start_date),
  amount     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  renewed_by TEXT NOT NULL DEFAULT 'Super Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name   TEXT NOT NULL,
  record_id    UUID,
  company_id   UUID,
  action       public.audit_action NOT NULL,
  old_data     JSONB,
  new_data     JSONB,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_status           ON public.companies(company_status);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_end ON public.companies(subscription_end);
CREATE INDEX IF NOT EXISTS idx_users_company_id           ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_active               ON public.users(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_company_id      ON public.categories(company_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id       ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id        ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_active            ON public.products(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_expiry            ON public.products(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_company_id           ON public.sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_operator_id          ON public.sales(operator_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at           ON public.sales(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id         ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_company_id      ON public.sale_items(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id       ON public.purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_at               ON public.purchases(company_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_company_id        ON public.expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date              ON public.expenses(company_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id   ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread       ON public.notifications(company_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_renewals_company_id        ON public.subscription_renewals(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company_id           ON public.audit_log(company_id);

-- Functions
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.fn_fill_sale_item_company_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.sales WHERE id = NEW.sale_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'superadmin' THEN
    INSERT INTO public.superadmin (id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'),''), NEW.email),
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name  = EXCLUDED.full_name,
      email      = EXCLUDED.email,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old JSONB; v_new JSONB; v_id UUID; v_cid UUID;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN v_old := row_to_json(OLD)::JSONB; END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN v_new := row_to_json(NEW)::JSONB; END IF;
  v_id  := COALESCE((v_new->>'id')::UUID, (v_old->>'id')::UUID);
  v_cid := CASE WHEN TG_TABLE_NAME='companies' THEN v_id
                ELSE COALESCE((v_new->>'company_id')::UUID,(v_old->>'company_id')::UUID) END;
  INSERT INTO public.audit_log(table_name,record_id,company_id,action,old_data,new_data,performed_by)
  VALUES(TG_TABLE_NAME,v_id,v_cid,TG_OP::public.audit_action,v_old,v_new,auth.uid());
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Triggers (drop first so re-runs are safe)
DROP TRIGGER IF EXISTS trg_companies_updated_at   ON public.companies;
DROP TRIGGER IF EXISTS trg_users_updated_at        ON public.users;
DROP TRIGGER IF EXISTS trg_superadmin_updated_at   ON public.superadmin;
DROP TRIGGER IF EXISTS trg_products_updated_at     ON public.products;
DROP TRIGGER IF EXISTS trg_sale_items_fill_company ON public.sale_items;
DROP TRIGGER IF EXISTS trg_on_auth_user_created    ON auth.users;
DROP TRIGGER IF EXISTS trg_audit_companies         ON public.companies;
DROP TRIGGER IF EXISTS trg_audit_sales             ON public.sales;
DROP TRIGGER IF EXISTS trg_audit_purchases         ON public.purchases;
DROP TRIGGER IF EXISTS trg_audit_expenses          ON public.expenses;

CREATE TRIGGER trg_companies_updated_at   BEFORE UPDATE ON public.companies   FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON public.users        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_superadmin_updated_at  BEFORE UPDATE ON public.superadmin   FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_products_updated_at    BEFORE UPDATE ON public.products     FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_sale_items_fill_company BEFORE INSERT ON public.sale_items  FOR EACH ROW EXECUTE FUNCTION public.fn_fill_sale_item_company_id();
CREATE TRIGGER trg_on_auth_user_created   AFTER  INSERT ON auth.users          FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_auth_user();
CREATE TRIGGER trg_audit_companies        AFTER  INSERT OR UPDATE OR DELETE ON public.companies  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_sales            AFTER  INSERT OR UPDATE OR DELETE ON public.sales      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_purchases        AFTER  INSERT OR UPDATE OR DELETE ON public.purchases  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_expenses         AFTER  INSERT OR UPDATE OR DELETE ON public.expenses   FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Row Level Security
ALTER TABLE public.companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log             ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first so re-runs are safe)
DROP POLICY IF EXISTS "companies_select_own"         ON public.companies;
DROP POLICY IF EXISTS "users_select_same_company"    ON public.users;
DROP POLICY IF EXISTS "users_update_own_record"      ON public.users;
DROP POLICY IF EXISTS "superadmin_select_own"        ON public.superadmin;
DROP POLICY IF EXISTS "superadmin_update_own"        ON public.superadmin;
DROP POLICY IF EXISTS "categories_company_all"       ON public.categories;
DROP POLICY IF EXISTS "products_company_all"         ON public.products;
DROP POLICY IF EXISTS "sales_company_all"            ON public.sales;
DROP POLICY IF EXISTS "sale_items_company_all"       ON public.sale_items;
DROP POLICY IF EXISTS "purchases_company_all"        ON public.purchases;
DROP POLICY IF EXISTS "expenses_company_all"         ON public.expenses;
DROP POLICY IF EXISTS "notifications_company_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_company_update" ON public.notifications;
DROP POLICY IF EXISTS "audit_log_company_select"     ON public.audit_log;

CREATE POLICY "companies_select_own"         ON public.companies      FOR SELECT USING (id = public.current_company_id());
CREATE POLICY "users_select_same_company"    ON public.users          FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "users_update_own_record"      ON public.users          FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "superadmin_select_own"        ON public.superadmin     FOR SELECT USING (id = auth.uid());
CREATE POLICY "superadmin_update_own"        ON public.superadmin     FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "categories_company_all"       ON public.categories     FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "products_company_all"         ON public.products       FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "sales_company_all"            ON public.sales          FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "sale_items_company_all"       ON public.sale_items     FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "purchases_company_all"        ON public.purchases      FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "expenses_company_all"         ON public.expenses       FOR ALL    USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "notifications_company_select" ON public.notifications  FOR SELECT USING (company_id = public.current_company_id());
CREATE POLICY "notifications_company_update" ON public.notifications  FOR UPDATE USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());
CREATE POLICY "audit_log_company_select"     ON public.audit_log      FOR SELECT USING (company_id = public.current_company_id());

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users                 TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.superadmin            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses              TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.notifications         TO authenticated;
GRANT SELECT                         ON public.subscription_renewals TO authenticated;
GRANT SELECT                         ON public.audit_log             TO authenticated;
