-- Simple cron job setup for automatic invoice generation
-- This assumes pg_cron extension is already enabled

-- Create a simple function to trigger invoice generation
CREATE OR REPLACE FUNCTION trigger_invoice_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log that the cron job is running
  INSERT INTO public.cron_log (message, created_at) 
  VALUES ('Invoice generation cron job triggered', NOW());
  
  -- Note: The actual Edge Function call will be handled by the application
  -- This function just logs the trigger for now
END;
$$;

-- Create a log table to track cron job executions
CREATE TABLE IF NOT EXISTS public.cron_log (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
COMMENT ON FUNCTION trigger_invoice_generation() IS 'Triggers automatic invoice generation (logs execution)';
COMMENT ON TABLE public.cron_log IS 'Logs cron job executions for monitoring';
