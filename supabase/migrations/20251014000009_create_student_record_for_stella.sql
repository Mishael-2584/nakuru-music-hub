-- Create student record for stellakaranja@gmail.com from registration
-- Date: 2025-10-14

DO $$
DECLARE
  student_user_id UUID;
  registration_record RECORD;
BEGIN
  -- Get the user_id from auth.users for this email
  SELECT id INTO student_user_id
  FROM auth.users
  WHERE email = 'stellakaranja@gmail.com';

  IF student_user_id IS NOT NULL THEN
    -- Check if student record already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.students
      WHERE user_id = student_user_id OR email = 'stellakaranja@gmail.com'
    ) THEN
      -- Try to find an approved registration for this email
      SELECT * INTO registration_record
      FROM public.registrations
      WHERE email = 'stellakaranja@gmail.com'
      AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT 1;

      IF registration_record IS NOT NULL THEN
        -- Create student record from registration
        INSERT INTO public.students (
          user_id,
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
          status,
          created_at
        ) VALUES (
          student_user_id,
          registration_record.id,
          registration_record.student_name,
          registration_record.age,
          registration_record.email,
          registration_record.phone,
          registration_record.country_code,
          registration_record.parent_name,
          registration_record.parent_phone,
          registration_record.instrument,
          registration_record.experience,
          registration_record.proficiency_level,
          registration_record.learning_mode,
          registration_record.owns_instrument,
          registration_record.location,
          registration_record.medical_condition,
          registration_record.medical_details,
          registration_record.goals,
          registration_record.preferred_schedule,
          registration_record.date_of_birth,
          'active',
          NOW()
        );
        RAISE NOTICE 'Created student record for stellakaranja@gmail.com from registration';
      ELSE
        -- No registration found, create a basic student record
        INSERT INTO public.students (
          user_id,
          student_name,
          email,
          status,
          created_at
        ) VALUES (
          student_user_id,
          'Stella Karanja',
          'stellakaranja@gmail.com',
          'active',
          NOW()
        );
        RAISE NOTICE 'Created basic student record for stellakaranja@gmail.com (no registration found)';
      END IF;
    ELSE
      -- Update user_id if student record exists but doesn't have user_id
      UPDATE public.students
      SET user_id = student_user_id
      WHERE email = 'stellakaranja@gmail.com'
      AND (user_id IS NULL OR user_id != student_user_id);
      RAISE NOTICE 'Updated student record with user_id for stellakaranja@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'User stellakaranja@gmail.com not found in auth.users';
  END IF;
END;
$$;

