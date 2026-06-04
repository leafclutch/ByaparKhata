-- Mixed payment support: cash_amount + online_amount split on sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount  NUMERIC(12,2) DEFAULT NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS online_amount NUMERIC(12,2) DEFAULT NULL;

-- Remarks/reason on manual inventory adjustments
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Index for notes search on sales and purchases (if you want DB-level search later)
-- notes columns already exist on sales and purchases tables from the original schema
