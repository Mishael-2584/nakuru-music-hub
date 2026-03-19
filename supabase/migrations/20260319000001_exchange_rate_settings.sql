-- Stores admin-provided currency conversion rates used for invoice calculations.
-- Example: 1 USD -> X KES

CREATE TABLE IF NOT EXISTS public.exchange_rate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);

COMMENT ON TABLE public.exchange_rate_settings IS 'Admin-configured FX rates used for invoice generation (e.g., USD -> KES).';
COMMENT ON COLUMN public.exchange_rate_settings.rate IS 'Conversion rate: 1 unit of from_currency in to_currency.';

ALTER TABLE public.exchange_rate_settings ENABLE ROW LEVEL SECURITY;

-- Read access: allow authenticated users to read the current rate.
DROP POLICY IF EXISTS "Authenticated can view exchange rate settings" ON public.exchange_rate_settings;
CREATE POLICY "Authenticated can view exchange rate settings"
  ON public.exchange_rate_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin access for writes.
DROP POLICY IF EXISTS "Admins can update exchange rate settings" ON public.exchange_rate_settings;
CREATE POLICY "Admins can update exchange rate settings"
  ON public.exchange_rate_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Admins can update exchange rate settings - update" ON public.exchange_rate_settings;
CREATE POLICY "Admins can update exchange rate settings - update"
  ON public.exchange_rate_settings
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Service role can access everything (used by edge functions).
DROP POLICY IF EXISTS "Service role can manage exchange rate settings" ON public.exchange_rate_settings;
CREATE POLICY "Service role can manage exchange rate settings"
  ON public.exchange_rate_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Ensure the USD -> KES default row exists.
INSERT INTO public.exchange_rate_settings (from_currency, to_currency, rate)
VALUES ('USD', 'KES', 150.5)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

