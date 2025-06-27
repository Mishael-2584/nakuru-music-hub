-- Fix student portal policies and ensure all components are properly set up
-- This migration handles policy conflicts and adds missing pieces

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage all practice logs" ON public.practice_logs;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can manage all progress reports" ON public.progress_reports;

-- Recreate admin policies with IF NOT EXISTS approach
DO $$
BEGIN
    -- Lessons admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'lessons' 
        AND policyname = 'Admins can manage all lessons'
    ) THEN
        CREATE POLICY "Admins can manage all lessons" ON public.lessons
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Practice logs admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'practice_logs' 
        AND policyname = 'Admins can manage all practice logs'
    ) THEN
        CREATE POLICY "Admins can manage all practice logs" ON public.practice_logs
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Assignments admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assignments' 
        AND policyname = 'Admins can manage all assignments'
    ) THEN
        CREATE POLICY "Admins can manage all assignments" ON public.assignments
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Messages admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'portal_messages' 
        AND policyname = 'Admins can manage all messages'
    ) THEN
        CREATE POLICY "Admins can manage all messages" ON public.portal_messages
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Payments admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments' 
        AND policyname = 'Admins can manage all payments'
    ) THEN
        CREATE POLICY "Admins can manage all payments" ON public.payments
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Attendance admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'attendance' 
        AND policyname = 'Admins can manage all attendance'
    ) THEN
        CREATE POLICY "Admins can manage all attendance" ON public.attendance
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;

    -- Progress reports admin policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'progress_reports' 
        AND policyname = 'Admins can manage all progress reports'
    ) THEN
        CREATE POLICY "Admins can manage all progress reports" ON public.progress_reports
        FOR ALL USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
        );
    END IF;
END $$;

-- Ensure the trigger to create student from registration exists
CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create student when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.students (
      registration_id,
      student_name,
      age,
      email,
      phone,
      country_code,
      parent_name,
      parent_phone,
      instrument,
      experience,
      proficiency_level,
      learning_mode,
      owns_instrument,
      location,
      medical_condition,
      medical_details,
      goals,
      preferred_schedule
    ) VALUES (
      NEW.id,
      NEW.student_name,
      NEW.age,
      NEW.email,
      NEW.phone,
      NEW.country_code,
      NEW.parent_name,
      NEW.parent_phone,
      NEW.instrument,
      NEW.experience,
      NEW.proficiency_level,
      NEW.learning_mode,
      NEW.owns_instrument,
      NEW.location,
      NEW.medical_condition,
      NEW.medical_details,
      NEW.goals,
      NEW.preferred_schedule
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_create_student_from_registration ON public.registrations;
CREATE TRIGGER trigger_create_student_from_registration
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_student_from_registration();

-- Test the system
DO $$
DECLARE
    test_registration_id UUID;
    test_student_id UUID;
BEGIN
    RAISE NOTICE '=== TESTING STUDENT PORTAL SYSTEM ===';
    
    -- Get a test registration
    SELECT id INTO test_registration_id FROM public.registrations WHERE status = 'pending' LIMIT 1;
    
    IF test_registration_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with registration ID: %', test_registration_id;
        
        -- Test updating registration to approved
        UPDATE public.registrations 
        SET status = 'approved' 
        WHERE id = test_registration_id;
        
        -- Check if student was created
        SELECT id INTO test_student_id FROM public.students WHERE registration_id = test_registration_id;
        
        IF test_student_id IS NOT NULL THEN
            RAISE NOTICE '✅ SUCCESS: Student created with ID: %', test_student_id;
            
            -- Revert the test
            UPDATE public.registrations 
            SET status = 'pending' 
            WHERE id = test_registration_id;
            
            DELETE FROM public.students WHERE id = test_student_id;
            
        ELSE
            RAISE NOTICE '❌ ERROR: Student was not created';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No pending registrations found to test with';
    END IF;
END $$; 