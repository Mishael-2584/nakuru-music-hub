-- Ultimate fix for enroll_student_with_code function - absolutely no ambiguous references
-- Date: 2025-07-02

DROP FUNCTION IF EXISTS enroll_student_with_code(UUID, TEXT);

CREATE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (classroom_id UUID, status TEXT) AS $$
DECLARE
  found_classroom_id UUID;
  enrollment_result_status TEXT;
BEGIN
  -- Find the classroom by class code with explicit table aliases
  SELECT c.id INTO found_classroom_id 
  FROM public.classrooms c
  WHERE c.class_code = class_code_param 
    AND c.status = 'approved';
    
  IF found_classroom_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive class code';
  END IF;

  -- Insert or update enrollment with explicit table aliases
  INSERT INTO public.classroom_enrollments(classroom_id, student_id, status)
  VALUES (found_classroom_id, student_id_param, 'enrolled')
  ON CONFLICT (classroom_id, student_id) 
  DO UPDATE SET 
    status = 'enrolled', 
    joined_at = now()
  RETURNING classroom_enrollments.status INTO enrollment_result_status;
  
  -- Return the results with explicit assignment
  classroom_id := found_classroom_id;
  status := enrollment_result_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql; 