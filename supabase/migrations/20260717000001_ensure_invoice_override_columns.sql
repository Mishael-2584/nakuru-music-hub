-- Ensure manual invoice edit columns exist on invoices (may be missing on some remotes).

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS manual_amount_due NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS manual_amount_override DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS manual_balance DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by UUID,
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

COMMENT ON COLUMN public.invoices.manual_amount_due IS 'Admin override for amount due (takes precedence in effective due).';
COMMENT ON COLUMN public.invoices.manual_amount_override IS 'Legacy/admin override amount; used with manual_amount_due for effective due.';
COMMENT ON COLUMN public.invoices.override_reason IS 'Admin reason for manual invoice amount override.';
COMMENT ON COLUMN public.invoices.overridden_by IS 'Admin user who last overrode the invoice amount.';
COMMENT ON COLUMN public.invoices.overridden_at IS 'When the invoice amount was last overridden.';

-- Allow authenticated admins to update these columns (idempotent grants).
GRANT UPDATE (
  amount_due,
  lessons_summary,
  pdf_url,
  updated_at,
  manual_amount_due,
  manual_amount_override,
  manual_balance,
  override_reason,
  overridden_by,
  overridden_at
) ON public.invoices TO authenticated;
