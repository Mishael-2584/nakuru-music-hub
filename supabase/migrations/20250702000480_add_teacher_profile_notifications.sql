-- Add notifications for teacher profile change approvals
-- This migration adds triggers to notify teachers when their profile changes are approved

-- Create trigger function to notify teacher when profile change is approved
CREATE OR REPLACE FUNCTION notify_teacher_profile_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed from 'pending' to 'approved'
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      data,
      expires_at
    ) VALUES (
      (SELECT user_id FROM teachers WHERE id = NEW.teacher_id),
      'approval_request_approved',
      'Profile Changes Approved',
      'Your profile changes have been approved and applied successfully.',
      jsonb_build_object(
        'request_id', NEW.id,
        'teacher_id', NEW.teacher_id,
        'approved_by', NEW.reviewed_by,
        'approved_at', NEW.reviewed_at
      ),
      NOW() + INTERVAL '30 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for teacher profile change approvals
DROP TRIGGER IF EXISTS teacher_profile_approval_notification ON teacher_profile_change_requests;
CREATE TRIGGER teacher_profile_approval_notification
  AFTER UPDATE ON teacher_profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_profile_approval();

-- Create trigger function to notify teacher when profile change is rejected
CREATE OR REPLACE FUNCTION notify_teacher_profile_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed from 'pending' to 'rejected'
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      data,
      expires_at
    ) VALUES (
      (SELECT user_id FROM teachers WHERE id = NEW.teacher_id),
      'approval_request_rejected',
      'Profile Changes Rejected',
      'Your profile changes have been rejected. Please review and resubmit if needed.',
      jsonb_build_object(
        'request_id', NEW.id,
        'teacher_id', NEW.teacher_id,
        'rejected_by', NEW.reviewed_by,
        'rejected_at', NEW.reviewed_at,
        'rejection_reason', NEW.review_notes
      ),
      NOW() + INTERVAL '30 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for teacher profile change rejections
DROP TRIGGER IF EXISTS teacher_profile_rejection_notification ON teacher_profile_change_requests;
CREATE TRIGGER teacher_profile_rejection_notification
  AFTER UPDATE ON teacher_profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_teacher_profile_rejection();
