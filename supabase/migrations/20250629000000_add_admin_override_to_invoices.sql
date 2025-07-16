-- Add admin_override column to invoices table
-- This column allows admins to override automatic invoice generation

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS admin_override boolean DEFAULT false;

-- Add comment to document the column purpose
COMMENT ON COLUMN invoices.admin_override IS 'Indicates if this invoice was manually created or modified by an admin'; 