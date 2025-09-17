-- Add student learning mode change requests table
-- This table tracks requests from students to change their learning mode (in-person, home, online)
-- Requires admin approval before the change is applied

CREATE TABLE IF NOT EXISTS public.student_learning_mode_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    current_learning_mode TEXT NOT NULL,
    requested_learning_mode TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.student_learning_mode_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view their own learning mode requests" ON public.student_learning_mode_requests
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Students can create requests for themselves
CREATE POLICY "Students can create learning mode requests" ON public.student_learning_mode_requests
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM public.students WHERE user_id = auth.uid()
        )
    );

-- Admins can view all requests (using profiles table)
CREATE POLICY "Admins can view all learning mode requests" ON public.student_learning_mode_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Admins can update request status (using profiles table)
CREATE POLICY "Admins can update learning mode requests" ON public.student_learning_mode_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Add comments
COMMENT ON TABLE public.student_learning_mode_requests IS 'Tracks student requests to change learning mode, requires admin approval';
COMMENT ON COLUMN public.student_learning_mode_requests.current_learning_mode IS 'Current learning mode before change request';
COMMENT ON COLUMN public.student_learning_mode_requests.requested_learning_mode IS 'Requested new learning mode';
COMMENT ON COLUMN public.student_learning_mode_requests.reason IS 'Student provided reason for the change';
COMMENT ON COLUMN public.student_learning_mode_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN public.student_learning_mode_requests.admin_notes IS 'Admin notes about the decision';
COMMENT ON COLUMN public.student_learning_mode_requests.reviewed_by IS 'Admin user who reviewed the request';
COMMENT ON COLUMN public.student_learning_mode_requests.reviewed_at IS 'When the request was reviewed';

-- Create function to automatically update student learning mode when approved
CREATE OR REPLACE FUNCTION public.handle_approved_learning_mode_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if status changed to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update the student's learning mode
        UPDATE public.students 
        SET learning_mode = NEW.requested_learning_mode,
            updated_at = NOW()
        WHERE id = NEW.student_id;
        
        -- Log the change
        INSERT INTO public.student_learning_mode_requests (
            student_id,
            current_learning_mode,
            requested_learning_mode,
            reason,
            status,
            admin_notes,
            reviewed_by,
            reviewed_at
        ) VALUES (
            NEW.student_id,
            OLD.current_learning_mode,
            NEW.requested_learning_mode,
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
    AFTER UPDATE ON public.student_learning_mode_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_approved_learning_mode_request();
