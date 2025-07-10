-- Migration: Update student creation trigger to include date_of_birth
-- This updates the function that creates students from registrations to include date_of_birth

-- Update the function to include date_of_birth
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
      date_of_birth
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
      NEW.date_of_birth
    );
  END IF;
  RETURN NEW;
END;
$$;

-- The trigger should already exist, but let's make sure it's using the updated function
-- The trigger will automatically use the updated function 