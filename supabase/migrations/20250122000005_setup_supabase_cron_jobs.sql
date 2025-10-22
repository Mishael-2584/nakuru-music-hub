-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to trigger invoice generation
CREATE OR REPLACE FUNCTION trigger_invoice_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Edge Function to generate recurring invoices
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-recurring-invoices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule cron jobs for automatic invoice generation
-- 1. Generate invoices on the 30th of each month (first invoices)
SELECT cron.schedule(
  'generate-first-invoices',
  '0 0 30 * *', -- At midnight on the 30th of every month
  'SELECT trigger_invoice_generation();'
);

-- 2. Generate invoices 7 days before month ends (next billing period)
-- This runs on the 23rd-29th depending on the month
SELECT cron.schedule(
  'generate-next-period-invoices',
  '0 0 23-29 * *', -- At midnight on 23rd-29th of every month
  'SELECT trigger_invoice_generation();'
);

-- 3. Generate invoices on the 7th of each month (due date)
SELECT cron.schedule(
  'generate-due-date-invoices',
  '0 0 7 * *', -- At midnight on the 7th of every month
  'SELECT trigger_invoice_generation();'
);

-- Add comments for documentation
COMMENT ON FUNCTION trigger_invoice_generation() IS 'Triggers automatic invoice generation via Edge Function';
COMMENT ON FUNCTION cron.schedule IS 'Schedules automatic invoice generation on specific dates';
