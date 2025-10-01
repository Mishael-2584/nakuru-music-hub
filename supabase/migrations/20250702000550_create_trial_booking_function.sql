-- Create a server function to handle trial booking creation
-- This bypasses RLS policies by using SECURITY DEFINER

CREATE OR REPLACE FUNCTION create_trial_booking(
  p_student_name TEXT,
  p_parent_name TEXT,
  p_student_age INTEGER,
  p_email TEXT,
  p_phone TEXT,
  p_instrument TEXT,
  p_skill_level TEXT,
  p_preferred_location TEXT,
  p_preferred_time TEXT,
  p_previous_experience TEXT DEFAULT NULL,
  p_learning_goals TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_special_requirements TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the trial booking
  INSERT INTO public.trial_bookings (
    student_name,
    parent_name,
    student_age,
    email,
    phone,
    instrument,
    skill_level,
    previous_experience,
    learning_goals,
    preferred_location,
    preferred_time,
    preferred_date,
    special_requirements,
    status
  ) VALUES (
    p_student_name,
    p_parent_name,
    p_student_age,
    p_email,
    p_phone,
    p_instrument,
    p_skill_level,
    p_previous_experience,
    p_learning_goals,
    p_preferred_location,
    p_preferred_time,
    p_preferred_date,
    p_special_requirements,
    'pending'
  ) RETURNING to_json(trial_bookings.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION create_trial_booking TO anon;
GRANT EXECUTE ON FUNCTION create_trial_booking TO authenticated;
GRANT EXECUTE ON FUNCTION create_trial_booking TO service_role;
