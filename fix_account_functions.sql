-- Run this script in your Supabase SQL Editor to create the missing functions
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.suspend_student_account(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.activate_student_account(UUID);

-- Create suspend_student_account function
CREATE OR REPLACE FUNCTION public.suspend_student_account(
  p_student_id UUID,
  p_reason TEXT,
  p_suspended_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.students
  SET 
    account_suspended = TRUE,
    suspension_reason = p_reason,
    suspended_by = p_suspended_by,
    suspended_at = NOW(),
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activate_student_account function
CREATE OR REPLACE FUNCTION public.activate_student_account(
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.students
  SET 
    account_suspended = FALSE,
    suspension_reason = NULL,
    suspended_by = NULL,
    suspended_at = NULL,
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.suspend_student_account(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID) TO authenticated;

-- Grant to service_role as well
GRANT EXECUTE ON FUNCTION public.suspend_student_account(UUID, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID) TO service_role;

-- Verify the functions were created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('suspend_student_account', 'activate_student_account');


