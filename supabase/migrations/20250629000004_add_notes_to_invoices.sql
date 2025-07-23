-- Add notes column to invoices table
-- This allows storing additional information about the invoice

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT;
 
-- Add comment to document the column purpose
COMMENT ON COLUMN invoices.notes IS 'Additional notes or comments about the invoice'; 