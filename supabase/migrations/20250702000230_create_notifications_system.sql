-- Create a comprehensive notifications system
-- This will handle approval status updates and other future notifications

-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'approval_request_approved',
        'approval_request_rejected', 
        'approval_request_submitted',
        'lesson_scheduled',
        'lesson_cancelled',
        'payment_due',
        'payment_received',
        'announcement',
        'system_update',
        'other'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data like request_id, lesson_id, etc.
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- Optional expiration date
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can create notifications for any user (via service role)
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Add comments
COMMENT ON TABLE public.notifications IS 'Comprehensive notifications system for all user notifications';
COMMENT ON COLUMN public.notifications.notification_type IS 'Type of notification: approval_request_approved, lesson_scheduled, etc.';
COMMENT ON COLUMN public.notifications.title IS 'Short title for the notification';
COMMENT ON COLUMN public.notifications.message IS 'Detailed message content';
COMMENT ON COLUMN public.notifications.data IS 'Additional JSON data like request_id, lesson_id, etc.';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the user has read this notification';
COMMENT ON COLUMN public.notifications.expires_at IS 'Optional expiration date for the notification';

-- Create function to create approval request notifications
CREATE OR REPLACE FUNCTION public.create_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_user_id UUID;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Get the student's user_id
    SELECT user_id INTO student_user_id
    FROM public.students
    WHERE id = NEW.student_id;
    
    -- Only create notification if status changed
    IF OLD.status != NEW.status THEN
        -- Determine notification content based on status
        IF NEW.status = 'approved' THEN
            notification_title := 'Request Approved';
            notification_message := 'Your ' || NEW.title || ' has been approved by admin.';
        ELSIF NEW.status = 'rejected' THEN
            notification_title := 'Request Rejected';
            notification_message := 'Your ' || NEW.title || ' has been rejected by admin.';
        END IF;
        
        -- Create the notification
        INSERT INTO public.notifications (
            user_id,
            notification_type,
            title,
            message,
            data,
            expires_at
        ) VALUES (
            student_user_id,
            CASE 
                WHEN NEW.status = 'approved' THEN 'approval_request_approved'
                WHEN NEW.status = 'rejected' THEN 'approval_request_rejected'
            END,
            notification_title,
            notification_message,
            jsonb_build_object(
                'request_id', NEW.id,
                'request_type', NEW.request_type,
                'requested_value', NEW.requested_value,
                'admin_notes', NEW.admin_notes
            ),
            NOW() + INTERVAL '30 days' -- Notifications expire after 30 days
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for approval request notifications
CREATE TRIGGER create_approval_notification_trigger
    AFTER UPDATE ON public.approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_approval_notification();

-- Create function to create notification when approval request is submitted
CREATE OR REPLACE FUNCTION public.create_request_submitted_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_user_id UUID;
BEGIN
    -- Get the student's user_id
    SELECT user_id INTO student_user_id
    FROM public.students
    WHERE id = NEW.student_id;
    
    -- Create notification for request submission
    INSERT INTO public.notifications (
        user_id,
        notification_type,
        title,
        message,
        data,
        expires_at
    ) VALUES (
        student_user_id,
        'approval_request_submitted',
        'Request Submitted',
        'Your ' || NEW.title || ' has been submitted for admin approval.',
        jsonb_build_object(
            'request_id', NEW.id,
            'request_type', NEW.request_type,
            'requested_value', NEW.requested_value
        ),
        NOW() + INTERVAL '30 days'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for request submission notifications
CREATE TRIGGER create_request_submitted_notification_trigger
    AFTER INSERT ON public.approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_request_submitted_notification();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql;
