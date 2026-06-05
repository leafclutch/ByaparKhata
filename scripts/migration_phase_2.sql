-- Phase 2 Migration: Company Branding, Inventory Ledger, and Tax Removal

-- 1. Update Companies table with new branding and info fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS pan_vat_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE companies DROP COLUMN IF EXISTS gst_number;

-- 2. Create Inventory Transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_change DECIMAL(12,2) NOT NULL,
    previous_stock DECIMAL(12,2) NOT NULL,
    new_stock DECIMAL(12,2) NOT NULL,
    reference_type TEXT NOT NULL, -- 'purchase', 'sale', 'return', 'adjustment'
    reference_id UUID,            -- ID of the sale or purchase
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inventory_transactions
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_transactions_company_all"
    ON inventory_transactions FOR ALL
    USING (company_id = public.current_company_id())
    WITH CHECK (company_id = public.current_company_id());

-- 3. Remove Tax columns
ALTER TABLE products DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE products DROP COLUMN IF EXISTS tax_type;

ALTER TABLE sales DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE sales DROP COLUMN IF EXISTS tax_amount;

ALTER TABLE sale_items DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE sale_items DROP COLUMN IF EXISTS tax_amount;

ALTER TABLE purchases DROP COLUMN IF EXISTS tax_rate;
ALTER TABLE purchases DROP COLUMN IF EXISTS tax_amount;

-- 4. Create Storage Bucket for Logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'company-logos' );

CREATE POLICY "Superadmin Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'company-logos' ); -- In production, restrict to superadmin role/ID

-- 5. Clean up any existing tax references in other tables if necessary
