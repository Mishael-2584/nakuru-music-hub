-- Fix the handle_new_user function to properly handle pending teachers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Check if user is a teacher (in teachers table or pending_teachers table)
  IF EXISTS (SELECT 1 FROM public.teachers WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'teacher');
  -- Check if user is a pending teacher (in pending_teachers table)
  ELSIF EXISTS (SELECT 1 FROM public.pending_teachers WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'teacher');
  -- Check if user is a student (in registrations table)
  ELSIF EXISTS (SELECT 1 FROM public.registrations WHERE email = NEW.email) THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'student');
  -- Default to admin for other users
  ELSE
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Check user role for mishaelgebre@gmail.com
SELECT 
  'profiles' as table_name,
  id,
  email,
  role
FROM public.profiles 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'teachers' as table_name,
  id,
  email,
  status as role
FROM public.teachers 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'pending_teachers' as table_name,
  id,
  email,
  status as role
FROM public.pending_teachers 
WHERE email = 'mishaelgebre@gmail.com'

UNION ALL

SELECT 
  'registrations' as table_name,
  id,
  email,
  status as role
FROM public.registrations 
WHERE email = 'mishaelgebre@gmail.com'; 