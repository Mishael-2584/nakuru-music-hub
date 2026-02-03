-- Fix: Map registration learning_mode values to students table allowed values
-- Students table only allows ('in-person', 'home', 'online') but registrations use 'home-lessons'

CREATE OR REPLACE FUNCTION create_student_from_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mapped_learning_mode TEXT;
BEGIN
  -- Map learning_mode to allowed values for students table
  mapped_learning_mode := CASE 
    WHEN NEW.learning_mode IN ('in-person', 'home', 'online') THEN NEW.learning_mode
    WHEN NEW.learning_mode IN ('home-lessons', 'home (nakuru & environs)') THEN 'home'
    ELSE 'in-person'
  END;

  -- Only create/update student when status changes to 'approved'
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
      sessions_per_week,
      course_category,
      production_type,
      technology_type
    ) VALUES (
      NEW.id,
      NEW.student_name,
      NEW.age,
      NEW.email,
      COALESCE(NEW.phone, ''),
      COALESCE(NEW.country_code, '+254'),
      NEW.parent_name,
      NEW.parent_phone,
      COALESCE(NULLIF(TRIM(NEW.instrument), ''), 
        CASE 
          WHEN NEW.course_category = 'Production' THEN COALESCE(NEW.production_type, 'Production')
          WHEN NEW.course_category = 'Technology' THEN COALESCE(NEW.technology_type, 'Technology')
          WHEN NEW.course_category = 'Art' THEN 'Art Classes'
          ELSE 'Piano'
        END),
      COALESCE(NEW.experience, 'beginner'),
      COALESCE(NEW.proficiency_level, 'beginner'),
      mapped_learning_mode,
      COALESCE(NEW.owns_instrument, false),
      NEW.location,
      COALESCE(NEW.medical_condition, 'no'),
      NEW.medical_details,
      NEW.goals,
      NEW.preferred_schedule,
      NEW.date_of_birth,
      COALESCE(NEW.sessions_per_week, 1),
      NEW.course_category,
      NEW.production_type,
      NEW.technology_type
    )
    ON CONFLICT (email) DO UPDATE SET
      registration_id = EXCLUDED.registration_id,
      student_name = EXCLUDED.student_name,
      age = EXCLUDED.age,
      phone = EXCLUDED.phone,
      country_code = EXCLUDED.country_code,
      parent_name = EXCLUDED.parent_name,
      parent_phone = EXCLUDED.parent_phone,
      instrument = EXCLUDED.instrument,
      experience = EXCLUDED.experience,
      proficiency_level = EXCLUDED.proficiency_level,
      learning_mode = EXCLUDED.learning_mode,
      owns_instrument = EXCLUDED.owns_instrument,
      location = EXCLUDED.location,
      medical_condition = EXCLUDED.medical_condition,
      medical_details = EXCLUDED.medical_details,
      goals = EXCLUDED.goals,
      preferred_schedule = EXCLUDED.preferred_schedule,
      date_of_birth = EXCLUDED.date_of_birth,
      sessions_per_week = EXCLUDED.sessions_per_week,
      course_category = EXCLUDED.course_category,
      production_type = EXCLUDED.production_type,
      technology_type = EXCLUDED.technology_type,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;
