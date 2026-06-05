-- Fix payment method support end-to-end: cash / online / mixed
-- Run the entire script in the Supabase SQL editor (each statement is on one line).
-- Safe to re-run — IF NOT EXISTS / DROP ... IF EXISTS guards are in place.

-- Convert ENUM → text and fix constraint on sales
ALTER TABLE sales ALTER COLUMN payment_method TYPE text USING payment_method::text;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash','online','mixed'));
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(14,2) DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS online_amount NUMERIC(14,2) DEFAULT NULL;

-- Convert ENUM → text and fix constraint on purchases
ALTER TABLE purchases ALTER COLUMN payment_method TYPE text USING payment_method::text;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_payment_method_check;
ALTER TABLE purchases ADD CONSTRAINT purchases_payment_method_check CHECK (payment_method IN ('cash','online','mixed'));
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(14,2) DEFAULT NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS online_amount NUMERIC(14,2) DEFAULT NULL;

-- Convert ENUM → text and fix constraint on expenses
ALTER TABLE expenses ALTER COLUMN payment_method TYPE text USING payment_method::text;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_payment_method_check;
ALTER TABLE expenses ADD CONSTRAINT expenses_payment_method_check CHECK (payment_method IN ('cash','online','mixed'));
