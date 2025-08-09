-- Fix all ambiguous column references in classroom functions
-- Date: 2025-07-02

-- Fix create_classroom function
CREATE OR REPLACE FUNCTION create_classroom(
  teacher_id_param UUID,
  name_param TEXT,
  description_param TEXT
)
RETURNS TABLE (id UUID, status TEXT) AS $$
DECLARE
  classroom_id UUID;
  classroom_status TEXT;
BEGIN
  INSERT INTO public.classrooms(teacher_id, name, description, status)
  VALUES (teacher_id_param, name_param, description_param, 'pending')
  RETURNING classrooms.id, classrooms.status INTO classroom_id, classroom_status;
  
  id := classroom_id;
  status := classroom_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Fix approve_classroom function
CREATE OR REPLACE FUNCTION approve_classroom(
  classroom_id_param UUID,
  approved_by_param UUID
)
RETURNS TABLE (id UUID, class_code TEXT, status TEXT) AS $$
DECLARE
  new_code TEXT;
  classroom_status TEXT;
BEGIN
  new_code := generate_class_code();
  
  UPDATE public.classrooms
  SET status = 'approved',
      class_code = new_code,
      approved_at = now(),
      approved_by = approved_by_param
  WHERE id = classroom_id_param
  RETURNING classrooms.id, classrooms.class_code, classrooms.status INTO id, class_code, classroom_status;
  
  status := classroom_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Fix enroll_student_with_code function
CREATE OR REPLACE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (classroom_id UUID, status TEXT) AS $$
DECLARE
  c_id UUID;
  enrollment_status TEXT;
  enrollment_classroom_id UUID;
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
  RETURNING classroom_enrollments.classroom_id, classroom_enrollments.status INTO enrollment_classroom_id, enrollment_status;
  
  classroom_id := enrollment_classroom_id;
  status := enrollment_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql; 