-- Ultimate fix for approve_classroom ambiguity
-- Date: 2025-07-02

DO $$ BEGIN
  -- Drop existing function if it exists
  PERFORM 1 FROM pg_proc WHERE proname = 'approve_classroom' AND oid = (
    SELECT p.oid FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'approve_classroom'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) = 'classroom_id_param uuid, approved_by_param uuid'
  );
  IF FOUND THEN
    DROP FUNCTION public.approve_classroom(classroom_id_param uuid, approved_by_param uuid);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.approve_classroom(
  classroom_id_param UUID,
  approved_by_param UUID
)
RETURNS TABLE (
  result_classroom_id UUID,
  result_class_code TEXT,
  result_status TEXT
) AS $$
DECLARE
  generated_code TEXT;
  updated_status TEXT;
  updated_id UUID;
  updated_code TEXT;
BEGIN
  generated_code := generate_class_code();

  UPDATE public.classrooms AS c
  SET status = 'approved',
      class_code = generated_code,
      approved_at = now(),
      approved_by = approved_by_param
  WHERE c.id = classroom_id_param
  RETURNING c.id, c.class_code, c.status INTO updated_id, updated_code, updated_status;

  result_classroom_id := updated_id;
  result_class_code := updated_code;
  result_status := updated_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;
