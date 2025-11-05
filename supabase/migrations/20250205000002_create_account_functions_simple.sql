-- Simple migration to create account suspension functions
-- Run with: npx supabase db push

-- Create suspend function
CREATE OR REPLACE FUNCTION public.suspend_student_account(
  p_student_id UUID,
  p_reason TEXT,
  p_suspended_by UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- Create activate function
CREATE OR REPLACE FUNCTION public.activate_student_account(
  p_student_id UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.suspend_student_account(UUID, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID) TO authenticated, service_role;

-- Record this migration in the tracking table (if it exists)
-- This ensures Supabase CLI knows this migration has been applied
DO $$
BEGIN
  -- Only insert if the migration tracking table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'supabase_migrations' 
    AND table_name = 'schema_migrations'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
    VALUES (
      '20250205000002',
      ARRAY[
        'CREATE OR REPLACE FUNCTION public.suspend_student_account(p_student_id UUID, p_reason TEXT, p_suspended_by UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.students SET account_suspended = TRUE, suspension_reason = p_reason, suspended_by = p_suspended_by, suspended_at = NOW(), updated_at = NOW() WHERE id = p_student_id; RETURN TRUE; END; $$;',
        'CREATE OR REPLACE FUNCTION public.activate_student_account(p_student_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.students SET account_suspended = FALSE, suspension_reason = NULL, suspended_by = NULL, suspended_at = NULL, updated_at = NOW() WHERE id = p_student_id; RETURN TRUE; END; $$;',
        'GRANT EXECUTE ON FUNCTION public.suspend_student_account(UUID, TEXT, UUID) TO authenticated, service_role;',
        'GRANT EXECUTE ON FUNCTION public.activate_student_account(UUID) TO authenticated, service_role;'
      ],
      'create_account_functions_simple'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

