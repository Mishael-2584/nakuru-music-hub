-- Add sessions_per_week column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sessions_per_week integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN invoices.sessions_per_week IS 'Number of sessions per week for this invoice (copied from registration at time of invoice creation)'; 