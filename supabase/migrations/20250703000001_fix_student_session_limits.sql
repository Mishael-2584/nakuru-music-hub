-- Migration: Fix student session limits to use actual enrollment data
-- This updates the student creation trigger to copy sessions_per_week from registration
-- and updates existing students to use their registration data instead of hardcoded values

-- Update the function to include sessions_per_week from registration
CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create student when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.students (
      registration_id,
      student_name,
      age,
      email,
      phone,
      country_code,
      parent_name,
      parent_phone,
      instrument,
      experience,
      proficiency_level,
      learning_mode,
      owns_instrument,
      location,
      medical_condition,
      medical_details,
      goals,
      preferred_schedule,
      date_of_birth,
      sessions_per_week
    ) VALUES (
      NEW.id,
      NEW.student_name,
      NEW.age,
      NEW.email,
      NEW.phone,
      NEW.country_code,
      NEW.parent_name,
      NEW.parent_phone,
      NEW.instrument,
      NEW.experience,
      NEW.proficiency_level,
      NEW.learning_mode,
      NEW.owns_instrument,
      NEW.location,
      NEW.medical_condition,
      NEW.medical_details,
      NEW.goals,
      NEW.preferred_schedule,
      NEW.date_of_birth,
      COALESCE(NEW.sessions_per_week, 1) -- Use registration sessions_per_week, default to 1
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Update existing students to use their registration sessions_per_week
-- This will fix students who were created before sessions_per_week was added to the trigger
UPDATE public.students s
SET sessions_per_week = COALESCE(r.sessions_per_week, 1)
FROM public.registrations r
WHERE s.registration_id = r.id
  AND r.status = 'approved'
  AND (s.sessions_per_week IS NULL OR s.sessions_per_week = 1); -- Only update if not already set or using default

-- For students without registration_id (direct creation), keep their current sessions_per_week
-- but ensure it's not null
UPDATE public.students
SET sessions_per_week = COALESCE(sessions_per_week, 1)
WHERE registration_id IS NULL;

-- Update the get_student_booking_status function to be more robust
CREATE OR REPLACE FUNCTION get_student_booking_status(student_id_param UUID)
RETURNS TABLE (
  sessions_per_week INTEGER,
  current_week_bookings INTEGER,
  remaining_sessions INTEGER,
  can_book_more BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.sessions_per_week, 1) as sessions_per_week,
    COALESCE(s.current_week_bookings, 0) as current_week_bookings,
    GREATEST(0, COALESCE(s.sessions_per_week, 1) - COALESCE(s.current_week_bookings, 0)) as remaining_sessions,
    COALESCE(s.current_week_bookings, 0) < COALESCE(s.sessions_per_week, 1) as can_book_more
  FROM public.students s
  WHERE s.id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add comment to explain the session limit logic
COMMENT ON FUNCTION get_student_booking_status(UUID) IS 
'Returns student booking status including sessions per week from their enrollment. 
1 session = 1 booking unless makeup credits are used. 
Sessions per week comes from the student''s registration/enrollment data.'; 