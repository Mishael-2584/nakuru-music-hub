-- Migration: Test time slot function and add debugging
-- Date: 2025-07-02

-- Function to test the time slot function with a specific student
CREATE OR REPLACE FUNCTION test_time_slot_function(test_student_id UUID DEFAULT NULL)
RETURNS TABLE (
  test_type TEXT,
  result TEXT,
  count INTEGER,
  details TEXT
) AS $$
DECLARE
  student_id_to_test UUID;
  slot_count INTEGER;
  teacher_count INTEGER;
BEGIN
  -- Use provided student ID or get the first student
  IF test_student_id IS NULL THEN
    SELECT id INTO student_id_to_test FROM public.students LIMIT 1;
  ELSE
    student_id_to_test := test_student_id;
  END IF;

  -- Test 1: Check if student exists
  IF student_id_to_test IS NULL THEN
    RETURN QUERY SELECT 
      'Student check'::TEXT as test_type,
      'No students found'::TEXT as result,
      0::INTEGER as count,
      'No students in database'::TEXT as details;
    RETURN;
  END IF;

  -- Test 2: Count teachers
  SELECT COUNT(*) INTO teacher_count FROM public.teachers WHERE status IN ('active', 'approved');
  RETURN QUERY SELECT 
    'Approved teachers'::TEXT as test_type,
    'Found'::TEXT as result,
    teacher_count::INTEGER as count,
    'Teachers with active/approved status'::TEXT as details;

  -- Test 3: Count time slots
  SELECT COUNT(*) INTO slot_count FROM public.time_slots WHERE is_available = true;
  RETURN QUERY SELECT 
    'Available time slots'::TEXT as test_type,
    'Found'::TEXT as result,
    slot_count::INTEGER as count,
    'Time slots with is_available = true'::TEXT as details;

  -- Test 4: Count time slots with teachers
  SELECT COUNT(*) INTO slot_count 
  FROM public.time_slots ts
  JOIN public.teachers t ON ts.teacher_id = t.id
  WHERE ts.is_available = true AND t.status IN ('active', 'approved');
  
  RETURN QUERY SELECT 
    'Time slots with approved teachers'::TEXT as test_type,
    'Found'::TEXT as result,
    slot_count::INTEGER as count,
    'Time slots linked to approved teachers'::TEXT as details;

  -- Test 5: Test the actual function
  SELECT COUNT(*) INTO slot_count 
  FROM get_available_time_slots_for_student(student_id_to_test);
  
  RETURN QUERY SELECT 
    'Function result'::TEXT as test_type,
    'Success'::TEXT as result,
    slot_count::INTEGER as count,
    'Slots returned by get_available_time_slots_for_student'::TEXT as details;

END;
$$ LANGUAGE plpgsql;

-- Function to manually create some test data
CREATE OR REPLACE FUNCTION create_test_time_slots()
RETURNS TEXT AS $$
DECLARE
  teacher_id UUID;
  slot_count INTEGER;
BEGIN
  -- Get the first approved teacher
  SELECT id INTO teacher_id FROM public.teachers WHERE status IN ('active', 'approved') LIMIT 1;
  
  IF teacher_id IS NULL THEN
    RETURN 'No approved teachers found';
  END IF;

  -- Create some test time slots
  INSERT INTO public.time_slots (
    teacher_id, day_of_week, start_time, end_time,
    slot_type, max_students, description, is_available
  ) VALUES 
    (teacher_id, 'Monday', '09:00', '10:00', 'regular', 1, 'Monday morning test slot', true),
    (teacher_id, 'Tuesday', '14:00', '15:00', 'regular', 1, 'Tuesday afternoon test slot', true),
    (teacher_id, 'Wednesday', '16:00', '17:00', 'regular', 1, 'Wednesday evening test slot', true),
    (teacher_id, 'Thursday', '10:00', '11:00', 'regular', 1, 'Thursday morning test slot', true),
    (teacher_id, 'Friday', '15:00', '16:00', 'regular', 1, 'Friday afternoon test slot', true)
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS slot_count = ROW_COUNT;
  
  RETURN 'Created ' || slot_count || ' test time slots for teacher ' || teacher_id;
END;
$$ LANGUAGE plpgsql; 