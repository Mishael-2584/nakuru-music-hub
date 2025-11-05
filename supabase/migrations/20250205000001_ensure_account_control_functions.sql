-- Ensure account suspension/activation functions exist
-- This migration ensures the RPC functions are properly created

-- Drop and recreate suspend function
DROP FUNCTION IF EXISTS public.suspend_student_account(UUID, TEXT, UUID);

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

-- Drop and recreate activate function
DROP FUNCTION IF EXISTS public.activate_student_account(UUID);

CREATE OR REPLACE FUNCTION public.activate_student_account(
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Reactivate account
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.suspend_student_account(UUID, TEXT, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID) TO service_role, authenticated;

-- Add comment
COMMENT ON FUNCTION public.suspend_student_account IS 'Suspends a student account with a reason, blocking all access';
COMMENT ON FUNCTION public.activate_student_account IS 'Reactivates a suspended student account, restoring access';


