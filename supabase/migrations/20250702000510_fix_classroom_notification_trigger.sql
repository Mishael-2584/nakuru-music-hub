-- Fix classroom approval notification trigger to use correct column name
-- Date: 2025-07-02

-- Create trigger function to notify admins when a classroom is created
CREATE OR REPLACE FUNCTION notify_classroom_approval_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_ids UUID[];
  admin_user_id UUID;
BEGIN
  -- Get all admin user IDs
  SELECT ARRAY_AGG(p.id) INTO admin_user_ids
  FROM profiles p
  WHERE p.role IN ('admin', 'super_admin');
  
  -- Create notifications for each admin
  IF admin_user_ids IS NOT NULL THEN
    FOREACH admin_user_id IN ARRAY admin_user_ids
    LOOP
      INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        data
      ) VALUES (
        admin_user_id,
        'announcement',
        'New Classroom Approval Request',
        'A new classroom "' || NEW.name || '" has been submitted by ' || (
          SELECT t.name FROM teachers t WHERE t.id = NEW.teacher_id
        ) || ' and requires your approval.',
        jsonb_build_object(
          'classroom_id', NEW.id,
          'classroom_name', NEW.name,
          'teacher_id', NEW.teacher_id,
          'teacher_name', (SELECT t.name FROM teachers t WHERE t.id = NEW.teacher_id),
          'created_at', NEW.created_at
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

