-- Fix trial booking function to properly handle NULL time slots
-- The previous version tried to access selected_slot.teacher_id when selected_slot was NULL

DROP FUNCTION IF EXISTS public.create_trial_booking(
  TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, UUID, UUID
);

CREATE OR REPLACE FUNCTION public.create_trial_booking(
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
  p_special_requirements TEXT DEFAULT NULL,
  p_selected_time_slot_id UUID DEFAULT NULL,
  p_selected_teacher_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the trial booking
  -- No complex logic needed - just save the request
  -- Admin will schedule the trial later
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
    status,
    assigned_teacher_id,
    scheduled_datetime,
    selected_time_slot_id
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
    'pending',  -- Always start as pending, admin will schedule
    p_selected_teacher_id,  -- May be NULL, admin assigns later
    NULL,  -- No scheduled datetime yet, admin will set it
    p_selected_time_slot_id  -- May be NULL
  ) RETURNING to_json(trial_bookings.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_trial_booking(
  TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, UUID, UUID
) TO anon, authenticated, service_role;
