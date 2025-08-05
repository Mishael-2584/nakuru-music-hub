-- Migration: Verify and create time slots if needed
-- Date: 2025-07-02

-- Function to check if time slots exist and create test data if needed
CREATE OR REPLACE FUNCTION verify_and_create_time_slots()
RETURNS TEXT AS $$
DECLARE
  teacher_count INTEGER;
  slot_count INTEGER;
  teacher_id UUID;
  created_slots INTEGER;
BEGIN
  -- Check how many approved teachers exist
  SELECT COUNT(*) INTO teacher_count 
  FROM public.teachers 
  WHERE status IN ('active', 'approved');
  
  -- Check how many time slots exist
  SELECT COUNT(*) INTO slot_count 
  FROM public.time_slots 
  WHERE is_available = true;
  
  -- If no time slots exist but we have teachers, create some test slots
  IF slot_count = 0 AND teacher_count > 0 THEN
    -- Get the first approved teacher
    SELECT id INTO teacher_id 
    FROM public.teachers 
    WHERE status IN ('active', 'approved') 
    LIMIT 1;
    
    -- Create test time slots
    INSERT INTO public.time_slots (
      teacher_id, day_of_week, start_time, end_time,
      slot_type, max_students, description, is_available
    ) VALUES 
      (teacher_id, 'Monday', '09:00', '10:00', 'regular', 1, 'Monday morning slot', true),
      (teacher_id, 'Tuesday', '14:00', '15:00', 'regular', 1, 'Tuesday afternoon slot', true),
      (teacher_id, 'Wednesday', '16:00', '17:00', 'regular', 1, 'Wednesday evening slot', true),
      (teacher_id, 'Thursday', '10:00', '11:00', 'regular', 1, 'Thursday morning slot', true),
      (teacher_id, 'Friday', '15:00', '16:00', 'regular', 1, 'Friday afternoon slot', true)
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS created_slots = ROW_COUNT;
    
    RETURN 'Created ' || created_slots || ' test time slots for teacher ' || teacher_id || '. Total teachers: ' || teacher_count || ', Total slots before: ' || slot_count;
  ELSE
    RETURN 'Time slots already exist. Total teachers: ' || teacher_count || ', Total slots: ' || slot_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get a summary of current data
CREATE OR REPLACE FUNCTION get_data_summary()
RETURNS TABLE (
  data_type TEXT,
  count INTEGER,
  details TEXT
) AS $$
BEGIN
  -- Teachers count
  RETURN QUERY SELECT 
    'Teachers'::TEXT as data_type,
    COUNT(*)::INTEGER as count,
    'Total teachers in system'::TEXT as details
  FROM public.teachers;
  
  -- Approved teachers count
  RETURN QUERY SELECT 
    'Approved Teachers'::TEXT as data_type,
    COUNT(*)::INTEGER as count,
    'Teachers with active/approved status'::TEXT as details
  FROM public.teachers 
  WHERE status IN ('active', 'approved');
  
  -- Time slots count
  RETURN QUERY SELECT 
    'Time Slots'::TEXT as data_type,
    COUNT(*)::INTEGER as count,
    'Total time slots in system'::TEXT as details
  FROM public.time_slots;
  
  -- Available time slots count
  RETURN QUERY SELECT 
    'Available Time Slots'::TEXT as data_type,
    COUNT(*)::INTEGER as count,
    'Time slots with is_available = true'::TEXT as details
  FROM public.time_slots 
  WHERE is_available = true;
  
  -- Students count
  RETURN QUERY SELECT 
    'Students'::TEXT as data_type,
    COUNT(*)::INTEGER as count,
    'Total students in system'::TEXT as details
  FROM public.students;
END;
$$ LANGUAGE plpgsql; 