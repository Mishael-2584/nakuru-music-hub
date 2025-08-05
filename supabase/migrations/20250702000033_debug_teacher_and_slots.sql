-- Migration: Debug teacher and time slots visibility
-- Date: 2025-07-02

-- Function to check teacher and time slot data
CREATE OR REPLACE FUNCTION debug_teacher_slots_data()
RETURNS TABLE (
  check_type TEXT,
  result TEXT,
  count INTEGER,
  details TEXT
) AS $$
BEGIN
  -- Check 1: Count all teachers
  RETURN QUERY
  SELECT 
    'All teachers'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Total teachers in system'::TEXT as details
  FROM public.teachers;
  
  -- Check 2: Count approved teachers
  RETURN QUERY
  SELECT 
    'Approved teachers'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Teachers with approved status'::TEXT as details
  FROM public.teachers 
  WHERE status = 'approved';
  
  -- Check 3: Count teachers with user_id
  RETURN QUERY
  SELECT 
    'Teachers with user_id'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Teachers linked to auth.users'::TEXT as details
  FROM public.teachers 
  WHERE user_id IS NOT NULL;
  
  -- Check 4: Count all time slots
  RETURN QUERY
  SELECT 
    'All time slots'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Total time slots in system'::TEXT as details
  FROM public.time_slots;
  
  -- Check 5: Count available time slots
  RETURN QUERY
  SELECT 
    'Available time slots'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Time slots with is_available = true'::TEXT as details
  FROM public.time_slots 
  WHERE is_available = true;
  
  -- Check 6: Count time slots with valid teacher
  RETURN QUERY
  SELECT 
    'Time slots with valid teacher'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Time slots linked to existing teachers'::TEXT as details
  FROM public.time_slots ts
  JOIN public.teachers t ON ts.teacher_id = t.id
  WHERE ts.is_available = true;
  
  -- Check 7: Count time slots with approved teachers
  RETURN QUERY
  SELECT 
    'Time slots with approved teachers'::TEXT as check_type,
    'Found'::TEXT as result,
    COUNT(*)::INTEGER as count,
    'Time slots from approved teachers'::TEXT as details
  FROM public.time_slots ts
  JOIN public.teachers t ON ts.teacher_id = t.id
  WHERE ts.is_available = true AND t.status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- Function to fix teacher status if needed
CREATE OR REPLACE FUNCTION fix_teacher_status()
RETURNS TEXT AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update teachers without status to 'approved'
  UPDATE public.teachers 
  SET status = 'approved' 
  WHERE status IS NULL OR status = '';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN 'Updated ' || updated_count || ' teachers to approved status';
END;
$$ LANGUAGE plpgsql;

-- Function to ensure teachers have user_id
CREATE OR REPLACE FUNCTION sync_teacher_user_ids()
RETURNS TEXT AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update teachers to link with auth.users based on email
  UPDATE public.teachers 
  SET user_id = auth.users.id
  FROM auth.users
  WHERE public.teachers.email = auth.users.email
  AND public.teachers.user_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN 'Updated ' || updated_count || ' teachers with user_id';
END;
$$ LANGUAGE plpgsql;

-- Function to create sample data for testing
CREATE OR REPLACE FUNCTION create_sample_teacher_data()
RETURNS TEXT AS $$
DECLARE
  teacher_id UUID;
  slot_count INTEGER;
BEGIN
  -- Create a sample teacher if none exist
  INSERT INTO public.teachers (
    name, email, phone, bio, experience, category, 
    subjects, status, created_at
  ) VALUES (
    'Sample Teacher', 'sample.teacher@example.com', '+1234567890',
    'Experienced music teacher', '5 years', 'Instrumental',
    ARRAY['Piano', 'Guitar'], 'approved', NOW()
  ) ON CONFLICT (email) DO NOTHING
  RETURNING id INTO teacher_id;
  
  -- If teacher was created, add some time slots
  IF teacher_id IS NOT NULL THEN
    INSERT INTO public.time_slots (
      teacher_id, day_of_week, start_time, end_time,
      slot_type, max_students, description, is_available
    ) VALUES 
      (teacher_id, 'Monday', '09:00', '10:00', 'regular', 1, 'Monday morning slot', true),
      (teacher_id, 'Tuesday', '14:00', '15:00', 'regular', 1, 'Tuesday afternoon slot', true),
      (teacher_id, 'Wednesday', '16:00', '17:00', 'regular', 1, 'Wednesday evening slot', true)
    ON CONFLICT DO NOTHING;
    
    GET DIAGNOSTICS slot_count = ROW_COUNT;
    RETURN 'Created sample teacher with ' || slot_count || ' time slots';
  ELSE
    RETURN 'Sample teacher already exists';
  END IF;
END;
$$ LANGUAGE plpgsql; 