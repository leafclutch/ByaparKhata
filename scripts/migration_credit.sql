-- Udharo Khata (Credit Management) Schema Migration

-- Tables
CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('issue', 'payment')),
  amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_company_id ON public.credit_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_customer_id ON public.credit_transactions(customer_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS Enablement
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "customers_company_all" ON public.customers;
CREATE POLICY "customers_company_all" ON public.customers FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "credit_tx_company_all" ON public.credit_transactions;
CREATE POLICY "credit_tx_company_all" ON public.credit_transactions FOR ALL USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

-- Audit Trigger Log
DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_credit_transactions ON public.credit_transactions;
CREATE TRIGGER trg_audit_credit_transactions AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_transactions TO authenticated;
