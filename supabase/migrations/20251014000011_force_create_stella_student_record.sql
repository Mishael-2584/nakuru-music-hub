-- Force create/update student record for stellakaranja@gmail.com
-- Date: 2025-10-14

DO $$
DECLARE
  student_user_id UUID := '26d93c77-2344-46c5-bcbe-6c88ea7cf6ac';
  existing_student_id UUID;
BEGIN
  -- Check if student record exists with this user_id
  SELECT id INTO existing_student_id
  FROM public.students
  WHERE user_id = student_user_id;

  IF existing_student_id IS NULL THEN
    -- Check if there's a student record with this email
    SELECT id INTO existing_student_id
    FROM public.students
    WHERE email = 'stellakaranja@gmail.com';

    IF existing_student_id IS NOT NULL THEN
      -- Update existing record with correct user_id
      UPDATE public.students
      SET user_id = student_user_id
      WHERE id = existing_student_id;
      RAISE NOTICE 'Updated existing student record (id: %) with user_id', existing_student_id;
    ELSE
      -- Create new student record
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
      RAISE NOTICE 'Created new student record for stellakaranja@gmail.com';
    END IF;
  ELSE
    RAISE NOTICE 'Student record already exists with correct user_id';
  END IF;

  -- Verify the record
  SELECT id INTO existing_student_id
  FROM public.students
  WHERE user_id = student_user_id;

  IF existing_student_id IS NOT NULL THEN
    RAISE NOTICE 'Verification: Student record exists with id=%', existing_student_id;
  ELSE
    RAISE EXCEPTION 'Failed to create/update student record';
  END IF;
END;
$$;

