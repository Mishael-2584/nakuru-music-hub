-- Migration: Rollback learning mode tables and functions
-- Date: 2025-09-08

-- Safe drop approach - check if table exists before dropping triggers and policies
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'learning_mode_change_requests') THEN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS on_learning_mode_request_created ON public.learning_mode_change_requests;
    
    -- Remove RLS policies if they exist
    DROP POLICY IF EXISTS "Students can manage their learning mode requests" ON public.learning_mode_change_requests;
    DROP POLICY IF EXISTS "Teachers can view their students' learning mode requests" ON public.learning_mode_change_requests;
    DROP POLICY IF EXISTS "Admins can manage all learning mode requests" ON public.learning_mode_change_requests;
    
    -- Finally drop the table
    DROP TABLE public.learning_mode_change_requests;
  END IF;
END
$$;

-- Drop any functions related to learning mode
DROP FUNCTION IF EXISTS handle_learning_mode_request(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS approve_learning_mode_request(UUID);
DROP FUNCTION IF EXISTS reject_learning_mode_request(UUID, TEXT);