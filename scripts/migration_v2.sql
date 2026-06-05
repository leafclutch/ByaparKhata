-- HamroHisab — Migration v2
-- Run this against an EXISTING database that already has the v1 schema.
-- All ALTER TABLE statements are idempotent (safe to run multiple times).

-- ─── Companies: new fields ──────────────────────────────────────────────────

ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_number       text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email        text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS joining_date         date DEFAULT CURRENT_DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_start   date;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_end     date;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status  text DEFAULT 'active'
  CHECK (subscription_status IN ('active','trial','paused','expired'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_status       text DEFAULT 'active'
  CHECK (company_status IN ('active','paused','disabled','expired'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan                 text DEFAULT 'starter'
  CHECK (plan IN ('free','starter','pro','enterprise'));

-- Backfill existing rows
UPDATE companies
SET
  subscription_status = 'active',
  company_status      = 'active',
  plan                = 'starter',
  joining_date        = created_at::date,
  subscription_start  = created_at::date,
  subscription_end    = (created_at::date + interval '1 year')::date
WHERE subscription_status IS NULL;

-- ─── Products: expiry fields ────────────────────────────────────────────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacture_date          date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiration_date           date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_notification_days  integer DEFAULT 30;

-- ─── New tables ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS superadmin (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text,
  email          text UNIQUE,
  contact_number text,
  avatar_url     text,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_renewals (
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

-- ─── New indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_expiry   ON products(company_id, expiration_date)
  WHERE is_active = true AND expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_status  ON companies(company_status);
CREATE INDEX IF NOT EXISTS idx_companies_sub_end ON companies(subscription_end);
CREATE INDEX IF NOT EXISTS idx_renewals_company  ON subscription_renewals(company_id);

-- ─── RLS for new tables ──────────────────────────────────────────────────────

ALTER TABLE superadmin            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_renewals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'superadmin' AND policyname = 'superadmin_own_profile'
  ) THEN
    CREATE POLICY "superadmin_own_profile" ON superadmin USING (id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscription_renewals' AND policyname = 'renewals_read_own'
  ) THEN
    CREATE POLICY "renewals_read_own" ON subscription_renewals
      FOR SELECT USING (company_id = get_user_company_id());
  END IF;
END $$;

-- ─── Expiry notification function ────────────────────────────────────────────
-- (copy from schema.sql if not already created)
-- After enabling pg_cron extension, schedule:
-- SELECT cron.schedule('daily-expiry-check', '0 8 * * *', 'SELECT generate_expiry_notifications()');
