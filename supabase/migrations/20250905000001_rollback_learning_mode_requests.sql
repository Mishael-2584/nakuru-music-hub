-- Migration: Rollback learning mode change request system
-- This migration removes only the request system objects while preserving direct learning mode updates

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_notify_learning_mode_decision ON public.learning_mode_change_requests;
DROP TRIGGER IF EXISTS trigger_notify_learning_mode_request ON public.learning_mode_change_requests;

-- Drop functions
DROP FUNCTION IF EXISTS public.notify_learning_mode_decision();
DROP FUNCTION IF EXISTS public.notify_learning_mode_request();
DROP FUNCTION IF EXISTS public.get_my_learning_mode_requests();
DROP FUNCTION IF EXISTS public.submit_learning_mode_change_request(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.process_learning_mode_request(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_pending_learning_mode_requests();

-- Drop tables (in correct order to respect foreign key constraints)
DROP TABLE IF EXISTS public.student_learning_mode_history;
DROP TABLE IF EXISTS public.learning_mode_change_requests;

-- IMPORTANT: Preserve the ability for students and admins to directly update learning_mode
-- We're only removing the request system, not the ability to change modes directly

-- Ensure the proper policy exists for students to update their own profiles
DO $$
BEGIN
  -- First, clean up any restrictive policies that might prevent direct updates
  DROP POLICY IF EXISTS "Students can update profile except learning mode" ON public.students;
  
  -- Make sure students can update their own profiles (including learning_mode)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'students' 
    AND policyname = 'Students can update own data'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can update own data" ON public.students
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
  END IF;
  
  -- Make sure admins can update all student profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'students' 
    AND policyname = 'Admins can update all student profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update all student profiles" ON public.students
      FOR UPDATE USING (auth.role() = ''admin'')
      WITH CHECK (auth.role() = ''admin'')';
  END IF;
END
$$;

-- Add comments for documentation
-- Migration comment: Rollback of learning mode change request system while preserving direct learning mode updates