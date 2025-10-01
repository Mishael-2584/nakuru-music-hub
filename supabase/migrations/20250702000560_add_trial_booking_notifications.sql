-- Create notification system for trial bookings
-- This will automatically create notifications when new trial bookings are submitted

-- Create function to notify about new trial bookings
CREATE OR REPLACE FUNCTION notify_trial_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all admins
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    notification_type,
    related_id,
    related_type,
    priority,
    is_read,
    created_at
  )
  SELECT 
    a.user_id,
    'New Trial Booking Request',
    'New trial booking from ' || NEW.student_name || ' for ' || NEW.instrument || ' at ' || NEW.preferred_location,
    'trial_booking',
    NEW.id::TEXT,
    'trial_booking',
    'high',
    false,
    NOW()
  FROM public.admins a
  WHERE a.user_id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notifications when trial bookings are created
DROP TRIGGER IF EXISTS trigger_notify_trial_booking_created ON public.trial_bookings;
CREATE TRIGGER trigger_notify_trial_booking_created
  AFTER INSERT ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_trial_booking_created();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_trial_booking_created() TO service_role;
GRANT EXECUTE ON FUNCTION notify_trial_booking_created() TO authenticated;
