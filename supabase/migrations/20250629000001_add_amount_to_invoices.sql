-- Add amount column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount numeric(12,2) DEFAULT 0 NOT NULL;
COMMENT ON COLUMN invoices.amount IS 'Total amount due for this invoice'; 