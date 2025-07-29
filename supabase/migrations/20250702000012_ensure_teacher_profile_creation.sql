-- Migration: Ensure teacher profile creation during approval
-- This migration fixes the timing issue where teacher profiles aren't created properly

-- 1. Update the handle_new_user function to be more robust for teachers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if user is a teacher (in teachers table)
  IF EXISTS (SELECT 1 FROM public.teachers WHERE user_id = NEW.id OR email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'teacher')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      role = 'teacher';
  -- Check if user is a pending teacher (in pending_teachers table)
  ELSIF EXISTS (SELECT 1 FROM public.pending_teachers WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'teacher')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      role = 'teacher';
  -- Check if user is a student (in registrations table)
  ELSIF EXISTS (SELECT 1 FROM public.registrations WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'student')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      role = 'student';
  -- Default to admin for other users
  ELSE
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'admin')
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email,
      role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create a function to manually ensure teacher profile exists
CREATE OR REPLACE FUNCTION ensure_teacher_profile(teacher_email TEXT, auth_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth_user_id) THEN
    -- Create profile
    INSERT INTO public.profiles (id, email, role)
    VALUES (auth_user_id, teacher_email, 'teacher');
  ELSE
    -- Update existing profile to ensure correct role
    UPDATE public.profiles 
    SET role = 'teacher', email = teacher_email
    WHERE id = auth_user_id;
  END IF;
  
  -- Ensure teacher record has user_id set
  UPDATE public.teachers 
  SET user_id = auth_user_id
  WHERE email = teacher_email;
END;
$$;

-- 3. Create a trigger to ensure profile creation when teacher is approved
CREATE OR REPLACE FUNCTION trigger_ensure_teacher_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Only run when teacher status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Find the auth user for this teacher
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = NEW.email;
    
    IF auth_user_id IS NOT NULL THEN
      -- Ensure profile exists
      PERFORM ensure_teacher_profile(NEW.email, auth_user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on teachers table
DROP TRIGGER IF EXISTS ensure_teacher_profile_trigger ON public.teachers;
CREATE TRIGGER ensure_teacher_profile_trigger
  AFTER INSERT OR UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ensure_teacher_profile();

-- 4. Backfill: Ensure all existing approved teachers have profiles
DO $$
DECLARE
  teacher_record RECORD;
  auth_user_id UUID;
BEGIN
  FOR teacher_record IN 
    SELECT t.*, u.id as auth_id
    FROM public.teachers t
    LEFT JOIN auth.users u ON t.email = u.email
    WHERE t.status = 'approved'
  LOOP
    IF teacher_record.auth_id IS NOT NULL THEN
      -- Ensure profile exists
      PERFORM ensure_teacher_profile(teacher_record.email, teacher_record.auth_id);
    END IF;
  END LOOP;
END $$;