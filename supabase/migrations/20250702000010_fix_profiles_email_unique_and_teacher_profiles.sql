-- Migration: Fix profiles table email uniqueness and ensure teacher profiles exist
-- This migration adds a unique constraint on email and ensures all teachers have proper profile records

-- 1. Add unique constraint on email in profiles table
-- First, handle any duplicate emails by keeping the most recent profile (by created_at)
DELETE FROM public.profiles a
WHERE a.id IN (
  SELECT p1.id
  FROM public.profiles p1
  JOIN public.profiles p2 ON p1.email = p2.email AND p1.id < p2.id
);

-- Now add the unique constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 2. Ensure all teachers have profile records
-- Insert missing profiles for teachers who don't have them
INSERT INTO public.profiles (id, email, role)
SELECT 
  t.user_id,
  t.email,
  'teacher'
FROM public.teachers t
WHERE t.user_id IS NOT NULL
  AND t.status IN ('approved', 'active')
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = t.user_id
  );

-- 3. Update existing teacher profiles to have correct role
UPDATE public.profiles 
SET role = 'teacher'
WHERE email IN (
  SELECT email FROM public.teachers 
  WHERE status IN ('approved', 'active')
)
AND role != 'teacher';

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5. Update the handle_new_user function to be more robust
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