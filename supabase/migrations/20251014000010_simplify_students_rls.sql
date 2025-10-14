-- Simplify RLS policies for students table to fix 500 errors
-- Date: 2025-10-14

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can select own data" ON public.students;
DROP POLICY IF EXISTS "Students can update own data" ON public.students;
DROP POLICY IF EXISTS "Admins can select all students" ON public.students;
DROP POLICY IF EXISTS "Admins can update all students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers can select their students" ON public.students;

-- Create simple, working policies

-- 1. Students can SELECT their own data (simple version)
CREATE POLICY "students_select_own"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Students can UPDATE their own data (simple version)
CREATE POLICY "students_update_own"
ON public.students
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Check if there are any issues with the student record for stellakaranja@gmail.com
DO $$
DECLARE
  student_record RECORD;
  student_user_id UUID;
BEGIN
  -- Get user_id
  SELECT id INTO student_user_id
  FROM auth.users
  WHERE email = 'stellakaranja@gmail.com';

  IF student_user_id IS NOT NULL THEN
    -- Get student record
    SELECT * INTO student_record
    FROM public.students
    WHERE user_id = student_user_id;

    IF student_record IS NOT NULL THEN
      RAISE NOTICE 'Student record found: id=%, user_id=%, email=%', 
        student_record.id, student_record.user_id, student_record.email;
    ELSE
      RAISE NOTICE 'No student record found for user_id: %', student_user_id;
      
      -- Check if there's a student record with this email but wrong user_id
      SELECT * INTO student_record
      FROM public.students
      WHERE email = 'stellakaranja@gmail.com';
      
      IF student_record IS NOT NULL THEN
        RAISE NOTICE 'Found student record with email but wrong user_id: current user_id=%, expected=%', 
          student_record.user_id, student_user_id;
        
        -- Fix the user_id
        UPDATE public.students
        SET user_id = student_user_id
        WHERE email = 'stellakaranja@gmail.com';
        
        RAISE NOTICE 'Updated student record user_id';
      END IF;
    END IF;
  END IF;
END;
$$;

