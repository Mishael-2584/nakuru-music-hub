-- Migration: Enhance trial booking function to support time slot scheduling
-- This allows trial bookings to be scheduled with specific teacher time slots

-- Drop the existing function first to avoid conflicts
DROP FUNCTION IF EXISTS create_trial_booking(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT);

-- Create the enhanced create_trial_booking function to support time slot scheduling
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
  p_special_requirements TEXT DEFAULT NULL,
  p_selected_time_slot_id UUID DEFAULT NULL,
  p_selected_teacher_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  selected_slot RECORD;
  scheduled_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
  -- If a time slot is selected, get the slot details and calculate scheduled datetime
  IF p_selected_time_slot_id IS NOT NULL THEN
    SELECT 
      ts.*,
      t.name as teacher_name,
      t.email as teacher_email,
      t.user_id as teacher_user_id
    INTO selected_slot
    FROM public.time_slots ts
    JOIN public.teachers t ON ts.teacher_id = t.id
    WHERE ts.id = p_selected_time_slot_id
      AND ts.is_available = true
      AND t.status IN ('active', 'approved');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected time slot is not available or teacher is not active';
    END IF;

    -- Calculate the scheduled datetime based on the next available date for this day
    scheduled_datetime := CASE 
      WHEN selected_slot.day_of_week = 'Monday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 1 THEN 
          (CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (8 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Tuesday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 2 THEN 
          (CURRENT_DATE + (2 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (9 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Wednesday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 3 THEN 
          (CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (10 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Thursday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 4 THEN 
          (CURRENT_DATE + (4 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (11 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Friday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 5 THEN 
          (CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (12 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Saturday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 6 THEN 
          (CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (13 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
      WHEN selected_slot.day_of_week = 'Sunday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 
          CURRENT_DATE + selected_slot.start_time
        ELSE 
          (CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER)::DATE + selected_slot.start_time
        END
    END;

    -- Check for conflicts on the scheduled date
    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.teacher_id = selected_slot.teacher_id
        AND b.booking_date = scheduled_datetime::DATE
        AND b.start_time = selected_slot.start_time
        AND b.end_time = selected_slot.end_time
        AND b.status != 'cancelled'
    ) THEN
      RAISE EXCEPTION 'Time slot is no longer available due to a conflict';
    END IF;
  END IF;

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
    CASE 
      WHEN p_selected_time_slot_id IS NOT NULL THEN 'scheduled' 
      ELSE 'pending' 
    END,
    COALESCE(p_selected_teacher_id, selected_slot.teacher_id),
    scheduled_datetime,
    p_selected_time_slot_id
  ) RETURNING to_json(trial_bookings.*) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION create_trial_booking TO anon;
GRANT EXECUTE ON FUNCTION create_trial_booking TO authenticated;
GRANT EXECUTE ON FUNCTION create_trial_booking TO service_role;

