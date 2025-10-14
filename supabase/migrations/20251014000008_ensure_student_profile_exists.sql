-- Ensure profile exists for student stellakaranja@gmail.com
-- Date: 2025-10-14

DO $$
DECLARE
  student_user_id UUID;
BEGIN
  -- Get the user_id from auth.users for this email
  SELECT id INTO student_user_id
  FROM auth.users
  WHERE email = 'stellakaranja@gmail.com';

  -- If user exists, ensure they have a profile
  IF student_user_id IS NOT NULL THEN
    -- Check if profile exists
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_user_id
    ) THEN
      -- Create profile if it doesn't exist
      INSERT INTO public.profiles (id, email, role, created_at)
      VALUES (
        student_user_id,
        'stellakaranja@gmail.com',
        'student',
        NOW()
      );
      RAISE NOTICE 'Created profile for student stellakaranja@gmail.com';
    ELSE
      -- Update role to student if it's not already
      UPDATE public.profiles
      SET role = 'student'
      WHERE id = student_user_id
      AND role != 'student';
      RAISE NOTICE 'Updated profile role for student stellakaranja@gmail.com';
    END IF;

    -- Check if student record exists
    IF NOT EXISTS (
      SELECT 1 FROM public.students
      WHERE user_id = student_user_id
    ) THEN
      RAISE NOTICE 'No student record found for stellakaranja@gmail.com - may need to be created from registration';
    ELSE
      RAISE NOTICE 'Student record exists for stellakaranja@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'User stellakaranja@gmail.com not found in auth.users';
  END IF;
END;
$$;

