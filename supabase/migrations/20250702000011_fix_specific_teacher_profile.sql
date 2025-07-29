-- Migration: Fix specific teacher profile for m1sha3lw3ldo@gmail.com
-- This migration ensures the specific teacher has a proper profile record

-- 1. Find the teacher record and auth user
DO $$
DECLARE
  teacher_record RECORD;
  auth_user_id UUID;
BEGIN
  -- Get the teacher record
  SELECT * INTO teacher_record 
  FROM public.teachers 
  WHERE email = 'm1sha3lw3ldo@gmail.com' 
  AND status IN ('approved', 'active');
  
  IF teacher_record IS NULL THEN
    RAISE NOTICE 'Teacher record not found for m1sha3lw3ldo@gmail.com';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found teacher record: %', teacher_record.id;
  
  -- Get the auth user ID
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'm1sha3lw3ldo@gmail.com';
  
  IF auth_user_id IS NULL THEN
    RAISE NOTICE 'Auth user not found for m1sha3lw3ldo@gmail.com';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found auth user: %', auth_user_id;
  
  -- 2. Update teacher record to ensure user_id is set
  UPDATE public.teachers 
  SET user_id = auth_user_id 
  WHERE email = 'm1sha3lw3ldo@gmail.com';
  
  RAISE NOTICE 'Updated teacher user_id';
  
  -- 3. Check if profile exists and create/update it
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth_user_id) THEN
    -- Update existing profile
    UPDATE public.profiles 
    SET role = 'teacher', email = 'm1sha3lw3ldo@gmail.com'
    WHERE id = auth_user_id;
    RAISE NOTICE 'Updated existing profile to teacher role';
  ELSE
    -- Create new profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (auth_user_id, 'm1sha3lw3ldo@gmail.com', 'teacher');
    RAISE NOTICE 'Created new teacher profile';
  END IF;
  
END $$;