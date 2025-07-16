-- Add fee_id column to invoices table to reference the fees table
-- This allows tracking which fee structure was used for each invoice

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fee_id UUID REFERENCES public.fees(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_fee_id ON public.invoices(fee_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN invoices.fee_id IS 'Reference to the fee structure used for this invoice'; 