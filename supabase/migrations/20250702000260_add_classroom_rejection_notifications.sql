-- Add notifications for rejected classrooms
-- Date: 2025-07-02

-- Create trigger function to notify teachers when their classroom is rejected
CREATE OR REPLACE FUNCTION notify_classroom_rejection()
RETURNS TRIGGER AS $$
DECLARE
  teacher_user_id UUID;
  teacher_name TEXT;
BEGIN
  -- Only trigger on status change to 'rejected'
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    -- Get teacher's user_id and name
    SELECT t.user_id, t.name INTO teacher_user_id, teacher_name
    FROM teachers t
    WHERE t.id = NEW.teacher_id;
    
    -- Create notification for the teacher
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      teacher_user_id,
      'classroom_rejected',
      'Classroom Application Rejected',
      'Your classroom application "' || NEW.name || '" has been rejected by an administrator.',
      jsonb_build_object(
        'classroom_id', NEW.id,
        'classroom_name', NEW.name,
        'rejected_at', NEW.approved_at,
        'rejected_by', NEW.approved_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on classrooms table
DROP TRIGGER IF EXISTS classroom_rejection_notification_trigger ON classrooms;
CREATE TRIGGER classroom_rejection_notification_trigger
  AFTER UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION notify_classroom_rejection();
