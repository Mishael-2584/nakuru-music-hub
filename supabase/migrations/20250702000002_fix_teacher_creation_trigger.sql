-- Migration: Fix teacher creation trigger to handle pending_teachers
-- This migration fixes the handle_new_user function to properly handle teacher creation

-- Update the handle_new_user function to support pending teachers
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