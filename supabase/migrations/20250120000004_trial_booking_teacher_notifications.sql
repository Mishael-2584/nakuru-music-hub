-- Migration: Add teacher notifications for trial booking assignments
-- This creates notifications when trial bookings are scheduled with specific teachers

-- Create function to notify teacher when trial booking is scheduled with them
CREATE OR REPLACE FUNCTION notify_teacher_trial_booking_assigned()
RETURNS TRIGGER AS $$
DECLARE
  teacher_user_id UUID;
  teacher_name TEXT;
  student_name TEXT;
  instrument_name TEXT;
  scheduled_date TEXT;
  scheduled_time TEXT;
BEGIN
  -- Only create notification if a teacher is assigned and status is 'scheduled'
  IF NEW.assigned_teacher_id IS NOT NULL AND NEW.status = 'scheduled' THEN
    -- Get teacher's user_id and name
    SELECT t.user_id, t.name INTO teacher_user_id, teacher_name
    FROM public.teachers t
    WHERE t.id = NEW.assigned_teacher_id;
    
    -- Get student and booking details
    student_name := NEW.student_name;
    instrument_name := NEW.instrument;
    
    -- Format scheduled date and time
    IF NEW.scheduled_datetime IS NOT NULL THEN
      scheduled_date := TO_CHAR(NEW.scheduled_datetime, 'Day, Month DD, YYYY');
      scheduled_time := TO_CHAR(NEW.scheduled_datetime, 'HH12:MI AM');
    ELSE
      scheduled_date := 'TBD';
      scheduled_time := 'TBD';
    END IF;
    
    -- Create notification for the teacher
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      notification_type,
      data,
      is_read,
      created_at
    ) VALUES (
      teacher_user_id,
      'New Trial Class Assignment',
      'You have been assigned a trial class with ' || student_name || ' for ' || instrument_name || ' on ' || scheduled_date || ' at ' || scheduled_time,
      'trial_assignment',
      jsonb_build_object(
        'trial_booking_id', NEW.id,
        'student_name', student_name,
        'parent_name', NEW.parent_name,
        'student_age', NEW.student_age,
        'email', NEW.email,
        'phone', NEW.phone,
        'instrument', instrument_name,
        'skill_level', NEW.skill_level,
        'preferred_location', NEW.preferred_location,
        'scheduled_datetime', NEW.scheduled_datetime,
        'special_requirements', NEW.special_requirements,
        'learning_goals', NEW.learning_goals,
        'previous_experience', NEW.previous_experience
      ),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notifications when trial bookings are assigned to teachers
DROP TRIGGER IF EXISTS trigger_notify_teacher_trial_assignment ON public.trial_bookings;
CREATE TRIGGER trigger_notify_teacher_trial_assignment
  AFTER INSERT OR UPDATE ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_trial_booking_assigned();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_teacher_trial_booking_assigned() TO service_role;
GRANT EXECUTE ON FUNCTION notify_teacher_trial_booking_assigned() TO authenticated;

