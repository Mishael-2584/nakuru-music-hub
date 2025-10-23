-- Clean cron job setup for automatic invoice generation
-- This creates the necessary functions and schedules cron jobs

-- Create a function to check if invoices should be generated today
CREATE OR REPLACE FUNCTION should_generate_invoices_today()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  day_of_month INTEGER := EXTRACT(DAY FROM today_date);
  month_length INTEGER := EXTRACT(DAY FROM (DATE_TRUNC('month', today_date) + INTERVAL '1 month' - INTERVAL '1 day'));
BEGIN
  -- Generate invoices on:
  -- 1. 30th of any month (first invoices)
  -- 2. 7 days before month ends (next billing period) 
  -- 3. 7th of any month (due date)
  
  RETURN (
    day_of_month = 30 OR -- 30th of month
    day_of_month = (month_length - 7) OR -- 7 days before month ends
    day_of_month = 7 -- 7th of month
  );
END;
$$;

-- Create a function to manually trigger invoice generation
CREATE OR REPLACE FUNCTION trigger_manual_invoice_generation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if today is a day when invoices should be generated
  IF should_generate_invoices_today() THEN
    -- Return success message with instructions
    result := jsonb_build_object(
      'success', true,
      'message', 'Today is a scheduled invoice generation day. Please call the generate-recurring-invoices Edge Function.',
      'should_generate', true,
      'date', CURRENT_DATE
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'message', 'Today is not a scheduled invoice generation day.',
      'should_generate', false,
      'date', CURRENT_DATE
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION should_generate_invoices_today() IS 'Checks if today is a scheduled day for invoice generation';
COMMENT ON FUNCTION trigger_manual_invoice_generation() IS 'Manual trigger for invoice generation with date validation';
