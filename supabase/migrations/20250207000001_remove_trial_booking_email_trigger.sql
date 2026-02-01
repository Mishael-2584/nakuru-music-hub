-- Remove trial booking email trigger that calls supabase.functions.invoke from the database.
-- Edge Function invocations from Postgres triggers are not supported (cross-database references error).
-- The admin panel already sends the trial class confirmation email to the student from the client;
-- teacher notifications are created via direct INSERT into notifications.

DROP TRIGGER IF EXISTS trigger_send_trial_booking_email_trigger ON public.trial_bookings;
DROP FUNCTION IF EXISTS trigger_send_trial_booking_email();
DROP FUNCTION IF EXISTS send_trial_booking_teacher_email(UUID);
