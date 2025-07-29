-- Migration: Ensure all teachers have proper user_id mappings
-- This migration fixes teacher access to bookings by ensuring proper user_id links

-- Update teachers table to ensure user_id is properly set
UPDATE public.teachers 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = teachers.email
)
WHERE user_id IS NULL 
AND email IN (
  SELECT email FROM auth.users
);

-- Create a function to sync teacher user_id mappings
CREATE OR REPLACE FUNCTION sync_teacher_user_mappings()
RETURNS void AS $$
BEGIN
  -- Update teachers with missing user_id
  UPDATE public.teachers 
  SET user_id = (
    SELECT id FROM auth.users 
    WHERE email = teachers.email
  )
  WHERE user_id IS NULL 
  AND email IN (
    SELECT email FROM auth.users
  );
  
  -- Log the changes
  RAISE NOTICE 'Updated teacher user_id mappings for teachers with missing user_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to sync mappings
SELECT sync_teacher_user_mappings();

-- Create index for better performance on teacher lookups
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);

-- Add a function to check teacher access
CREATE OR REPLACE FUNCTION check_teacher_access(input_email TEXT)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  user_id UUID,
  auth_user_id UUID,
  auth_email TEXT,
  bookings_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as teacher_id,
    t.name as teacher_name,
    t.email as teacher_email,
    t.user_id,
    au.id as auth_user_id,
    au.email as auth_email,
    COUNT(b.id) as bookings_count
  FROM public.teachers t
  LEFT JOIN auth.users au ON t.user_id = au.id
  LEFT JOIN public.bookings b ON t.id = b.teacher_id
  WHERE t.email = input_email
  GROUP BY t.id, t.name, t.email, t.user_id, au.id, au.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;