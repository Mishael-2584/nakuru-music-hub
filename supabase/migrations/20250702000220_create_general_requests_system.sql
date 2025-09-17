-- Create a general requests system for all types of approval requests
-- This replaces the specific learning mode requests with a more flexible system

-- Create the general requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('learning_mode_change', 'profile_update', 'schedule_change', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    current_value TEXT, -- Current value (e.g., current learning mode)
    requested_value TEXT, -- Requested value (e.g., new learning mode)
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view their own approval requests" ON public.approval_requests
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Students can create requests for themselves
CREATE POLICY "Students can create approval requests" ON public.approval_requests
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Admins can view all requests
CREATE POLICY "Admins can view all approval requests" ON public.approval_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update request status
CREATE POLICY "Admins can update approval requests" ON public.approval_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Add comments
COMMENT ON TABLE public.approval_requests IS 'General requests system for all types of student approval requests';
COMMENT ON COLUMN public.approval_requests.request_type IS 'Type of request: learning_mode_change, profile_update, schedule_change, other';
COMMENT ON COLUMN public.approval_requests.title IS 'Short title describing the request';
COMMENT ON COLUMN public.approval_requests.description IS 'Detailed description of the request';
COMMENT ON COLUMN public.approval_requests.current_value IS 'Current value before change';
COMMENT ON COLUMN public.approval_requests.requested_value IS 'Requested new value';
COMMENT ON COLUMN public.approval_requests.reason IS 'Student provided reason for the request';
COMMENT ON COLUMN public.approval_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN public.approval_requests.admin_notes IS 'Admin notes about the decision';

-- Create function to handle approved learning mode requests
CREATE OR REPLACE FUNCTION public.handle_approved_learning_mode_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status changed to approved and it's a learning mode change
    IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.request_type = 'learning_mode_change' THEN
        -- Update the student's learning mode
        UPDATE public.students 
        SET learning_mode = NEW.requested_value,
            updated_at = NOW()
        WHERE id = NEW.student_id;
        
        -- Log the change
        INSERT INTO public.approval_requests (
            student_id,
            request_type,
            title,
            description,
            current_value,
            requested_value,
            reason,
            status,
            admin_notes,
            reviewed_by,
            reviewed_at
        ) VALUES (
            NEW.student_id,
            'system_log',
            'Learning Mode Change Applied',
            'System automatically applied approved learning mode change',
            OLD.current_value,
            NEW.requested_value,
            'Automatically applied approved change',
            'applied',
            'System applied approved learning mode change',
            NEW.reviewed_by,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle approved requests
CREATE TRIGGER handle_approved_learning_mode_request_trigger
    AFTER UPDATE ON public.approval_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_approved_learning_mode_request();

-- Migrate existing learning mode requests to the new system
INSERT INTO public.approval_requests (
    student_id,
    request_type,
    title,
    description,
    current_value,
    requested_value,
    reason,
    status,
    admin_notes,
    reviewed_by,
    reviewed_at,
    created_at
)
SELECT 
    student_id,
    'learning_mode_change',
    'Learning Mode Change Request',
    'Student requested to change learning mode from ' || current_learning_mode || ' to ' || requested_learning_mode,
    current_learning_mode,
    requested_learning_mode,
    reason,
    status,
    admin_notes,
    reviewed_by,
    reviewed_at,
    created_at
FROM public.student_learning_mode_requests;

-- Drop the old learning mode requests table
DROP TABLE IF EXISTS public.student_learning_mode_requests;
