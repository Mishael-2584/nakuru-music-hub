-- Alternative: Database trigger approach (requires pg_cron extension)
-- This would run automatically if pg_cron is available

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION call_invoice_generation_edge_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This would call the Edge Function automatically
  -- But requires pg_cron extension which may not be available
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

-- Schedule daily execution at midnight UTC
SELECT cron.schedule(
  'daily-invoice-generation',
  '0 0 * * *', -- Daily at midnight UTC
  'SELECT call_invoice_generation_edge_function();'
);
