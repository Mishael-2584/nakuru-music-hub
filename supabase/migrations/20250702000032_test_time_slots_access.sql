-- Migration: Test time slots access and add sample data
-- Date: 2025-07-02

-- Function to test time slots access for different user types
CREATE OR REPLACE FUNCTION test_time_slots_access()
RETURNS TABLE (
  test_type TEXT,
  result TEXT,
  count INTEGER
) AS $$
BEGIN
  -- Test 1: Count all time slots (should work for all users)
  RETURN QUERY
  SELECT 
    'All time slots'::TEXT as test_type,
    'Success'::TEXT as result,
    COUNT(*)::INTEGER as count
  FROM public.time_slots;
  
  -- Test 2: Count available time slots (should work for all users)
  RETURN QUERY
  SELECT 
    'Available time slots'::TEXT as test_type,
    'Success'::TEXT as result,
    COUNT(*)::INTEGER as count
  FROM public.time_slots 
  WHERE is_available = true;
  
  -- Test 3: Count time slots with teachers info (should work for all users)
  RETURN QUERY
  SELECT 
    'Time slots with teacher info'::TEXT as test_type,
    'Success'::TEXT as result,
    COUNT(*)::INTEGER as count
  FROM public.time_slots ts
  JOIN public.teachers t ON ts.teacher_id = t.id
  WHERE ts.is_available = true;
END;
$$ LANGUAGE plpgsql;

-- Insert a sample time slot if none exist (for testing)
INSERT INTO public.time_slots (
  teacher_id,
  day_of_week,
  start_time,
  end_time,
  slot_type,
  max_students,
  description,
  is_available
) 
SELECT 
  t.id,
  'Monday',
  '09:00',
  '10:00',
  'regular',
  1,
  'Sample time slot for testing',
  true
FROM public.teachers t 
WHERE t.status = 'approved'
LIMIT 1
ON CONFLICT DO NOTHING; 