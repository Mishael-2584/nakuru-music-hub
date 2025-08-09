-- Fix ambiguous column references in enroll_student_with_code function
-- Date: 2025-07-02

CREATE OR REPLACE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (classroom_id UUID, status TEXT) AS $$
DECLARE
  c_id UUID;
  enrollment_status TEXT;
BEGIN
  SELECT id INTO c_id 
  FROM public.classrooms 
  WHERE class_code = class_code_param 
    AND status = 'approved';
    
  IF c_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive class code';
  END IF;

  INSERT INTO public.classroom_enrollments(classroom_id, student_id, status)
  VALUES (c_id, student_id_param, 'enrolled')
  ON CONFLICT (classroom_id, student_id) 
  DO UPDATE SET status = 'enrolled', joined_at = now()
  RETURNING classroom_enrollments.classroom_id, classroom_enrollments.status INTO classroom_id, enrollment_status;
  
  status := enrollment_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql; 