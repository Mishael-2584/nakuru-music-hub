-- Rename OUT columns in enroll_student_with_code to avoid ambiguity with table columns
-- Date: 2025-07-02

DROP FUNCTION IF EXISTS enroll_student_with_code(UUID, TEXT);

CREATE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (result_classroom_id UUID, result_status TEXT) AS $$
DECLARE
  v_classroom_id UUID;
  v_status TEXT;
BEGIN
  -- Find approved classroom by code
  SELECT c.id INTO v_classroom_id
  FROM public.classrooms c
  WHERE c.class_code = class_code_param
    AND c.status = 'approved';

  IF v_classroom_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive class code';
  END IF;

  -- Upsert enrollment
  INSERT INTO public.classroom_enrollments(classroom_id, student_id, status)
  VALUES (v_classroom_id, student_id_param, 'enrolled')
  ON CONFLICT (classroom_id, student_id)
  DO UPDATE SET status = 'enrolled', joined_at = now()
  RETURNING classroom_enrollments.status INTO v_status;

  -- Return values using OUT column names that don't collide
  result_classroom_id := v_classroom_id;
  result_status := v_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;