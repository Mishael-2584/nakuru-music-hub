-- Store PayNexus hosted checkout links on invoices (for email Pay Now).

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_session_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_payment_link_reference
  ON public.invoices (payment_link_reference)
  WHERE payment_link_reference IS NOT NULL;

COMMENT ON COLUMN public.invoices.payment_link_url IS 'PayNexus hosted checkout URL for email/share payments.';
COMMENT ON COLUMN public.invoices.payment_link_reference IS 'Merchant reference sent to PayNexus (dma-invoice:{uuid}).';
