-- Fix trial booking notification trigger to use correct column names
-- The trigger was trying to use columns that don't exist in the notifications table

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_notify_trial_booking_created ON public.trial_bookings;
DROP FUNCTION IF EXISTS notify_trial_booking_created();

-- Create the corrected function
CREATE OR REPLACE FUNCTION notify_trial_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admins (using profiles table for admin users)
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    notification_type,
    data,
    is_read,
    created_at
  )
  SELECT 
    p.id,
    'New Trial Booking Request',
    'New trial booking from ' || NEW.student_name || ' for ' || NEW.instrument || ' at ' || NEW.preferred_location,
    'trial_booking',
    jsonb_build_object(
      'trial_booking_id', NEW.id,
      'student_name', NEW.student_name,
      'instrument', NEW.instrument,
      'preferred_location', NEW.preferred_location,
      'preferred_time', NEW.preferred_time,
      'email', NEW.email,
      'phone', NEW.phone
    ),
    false,
    NOW()
  FROM public.profiles p
  WHERE p.role IN ('admin', 'super_admin')
  AND p.id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notifications when trial bookings are created
CREATE TRIGGER trigger_notify_trial_booking_created
  AFTER INSERT ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_trial_booking_created();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_trial_booking_created() TO service_role;
GRANT EXECUTE ON FUNCTION notify_trial_booking_created() TO authenticated;
