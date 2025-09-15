-- Migration: Fix weekly session limits calculation
-- This migration fixes the weekly session limit calculation to properly handle week transitions
-- and ensures students can book in new weeks

-- Fix the validate_student_booking_capacity function to use consistent week calculation
CREATE OR REPLACE FUNCTION validate_student_booking_capacity(
  student_id_param UUID,
  booking_date_param DATE
)
RETURNS JSON AS $$
DECLARE
  student_record RECORD;
  current_bookings INTEGER;
  available_makeup_credits INTEGER;
  total_capacity INTEGER;
  week_start DATE;
  week_end DATE;
  result JSON;
BEGIN
  -- Get student's session limit
  SELECT sessions_per_week INTO student_record
  FROM public.students
  WHERE id = student_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_book', false, 'reason', 'Student not found');
  END IF;
  
  -- Calculate week boundaries consistently
  -- Use Monday as the start of the week for consistency
  week_start := DATE_TRUNC('week', booking_date_param);
  week_end := week_start + INTERVAL '6 days';
  
  -- Count current confirmed bookings for the same week as the booking date
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE student_id = student_id_param
  AND booking_date >= week_start
  AND booking_date <= week_end
  AND status = 'confirmed';
  
  -- Count available makeup credits
  SELECT COUNT(*) INTO available_makeup_credits
  FROM public.makeup_credits
  WHERE student_id = student_id_param
  AND is_used = false
  AND expires_at >= CURRENT_DATE;
  
  -- Calculate total capacity (regular sessions + makeup credits)
  total_capacity := COALESCE(student_record.sessions_per_week, 1) + available_makeup_credits;
  
  -- Log for debugging
  RAISE NOTICE 'Student %, Booking date: %, Week start: %, Week end: %, Current bookings: %, Total capacity: %', 
    student_id_param, booking_date_param, week_start, week_end, current_bookings, total_capacity;
  
  IF current_bookings >= total_capacity THEN
    result := json_build_object(
      'can_book', false,
      'reason', 'Weekly booking limit reached',
      'current_bookings', current_bookings,
      'total_capacity', total_capacity,
      'regular_sessions', COALESCE(student_record.sessions_per_week, 1),
      'available_makeup_credits', available_makeup_credits,
      'week_start', week_start,
      'week_end', week_end
    );
  ELSE
    result := json_build_object(
      'can_book', true,
      'current_bookings', current_bookings,
      'total_capacity', total_capacity,
      'remaining_slots', total_capacity - current_bookings,
      'regular_sessions', COALESCE(student_record.sessions_per_week, 1),
      'available_makeup_credits', available_makeup_credits,
      'week_start', week_start,
      'week_end', week_end
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the check_student_booking_limit function to use consistent week calculation
CREATE OR REPLACE FUNCTION check_student_booking_limit(
  student_id_param UUID,
  requested_sessions INTEGER DEFAULT 1,
  booking_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  student_sessions_per_week INTEGER;
  current_week_bookings INTEGER;
  week_start DATE;
  week_end DATE;
  can_book BOOLEAN;
BEGIN
  -- Get student's session limit
  SELECT COALESCE(sessions_per_week, 1) INTO student_sessions_per_week
  FROM public.students
  WHERE id = student_id_param;
  
  -- Calculate week boundaries consistently
  week_start := DATE_TRUNC('week', booking_date_param);
  week_end := week_start + INTERVAL '6 days';
  
  -- Get current week bookings for this student
  SELECT COUNT(*) INTO current_week_bookings
  FROM public.bookings
  WHERE student_id = student_id_param
    AND booking_date >= week_start
    AND booking_date <= week_end
    AND status != 'cancelled';
  
  -- Check if student can book more sessions
  can_book := (current_week_bookings + requested_sessions) <= student_sessions_per_week;
  
  -- Log for debugging
  RAISE NOTICE 'Student %, Booking date: %, Week start: %, Current bookings: %, Sessions per week: %, Can book: %', 
    student_id_param, booking_date_param, week_start, current_week_bookings, student_sessions_per_week, can_book;
  
  RETURN can_book;
END;
$$ LANGUAGE plpgsql;

-- Update the get_student_booking_status function to use the booking date parameter
CREATE OR REPLACE FUNCTION get_student_booking_status(
  student_id_param UUID,
  booking_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  sessions_per_week INTEGER,
  current_week_bookings INTEGER,
  remaining_sessions INTEGER,
  can_book_more BOOLEAN,
  week_start DATE,
  week_end DATE
) AS $$
DECLARE
  week_start_calc DATE;
  week_end_calc DATE;
BEGIN
  -- Calculate week boundaries
  week_start_calc := DATE_TRUNC('week', booking_date_param);
  week_end_calc := week_start_calc + INTERVAL '6 days';
  
  RETURN QUERY
  SELECT 
    COALESCE(s.sessions_per_week, 1) as sessions_per_week,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status != 'cancelled'
    ), 0) as current_week_bookings,
    GREATEST(0, COALESCE(s.sessions_per_week, 1) - COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status != 'cancelled'
    ), 0)) as remaining_sessions,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status != 'cancelled'
    ), 0) < COALESCE(s.sessions_per_week, 1) as can_book_more,
    week_start_calc as week_start,
    week_end_calc as week_end
  FROM public.students s
  WHERE s.id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add a helper function to get the current week details for debugging
CREATE OR REPLACE FUNCTION get_week_details(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  target_date_param DATE,
  week_start DATE,
  week_end DATE,
  day_of_week INTEGER,
  week_number INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    target_date as target_date_param,
    DATE_TRUNC('week', target_date)::DATE as week_start,
    (DATE_TRUNC('week', target_date) + INTERVAL '6 days')::DATE as week_end,
    EXTRACT(DOW FROM target_date)::INTEGER as day_of_week,
    EXTRACT(WEEK FROM target_date)::INTEGER as week_number;
END;
$$ LANGUAGE plpgsql;

-- Add a function to reset student weekly booking counts (for manual maintenance if needed)
CREATE OR REPLACE FUNCTION reset_weekly_booking_counts()
RETURNS VOID AS $$
BEGIN
  -- This function can be called to reset the current_week_bookings column
  -- though it's mainly for legacy support since we now calculate dynamically
  UPDATE public.students
  SET current_week_bookings = 0
  WHERE current_week_bookings > 0;
  
  RAISE NOTICE 'Weekly booking counts reset for all students';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_student_booking_capacity(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_student_booking_limit(UUID, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_booking_status(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_details(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_weekly_booking_counts() TO authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION validate_student_booking_capacity(UUID, DATE) IS 
'Fixed version that uses consistent week calculation based on the booking date parameter. 
Week starts on Monday and ends on Sunday. This ensures proper weekly limit enforcement 
regardless of when the booking is made within the week.';