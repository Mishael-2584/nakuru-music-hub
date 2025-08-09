-- Fix ambiguous column reference in approve_classroom by qualifying id with table name
-- Date: 2025-07-02

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
  WHERE classrooms.id = classroom_id_param
  RETURNING classrooms.id, classrooms.class_code, classrooms.status INTO id, class_code, classroom_status;

  status := classroom_status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

