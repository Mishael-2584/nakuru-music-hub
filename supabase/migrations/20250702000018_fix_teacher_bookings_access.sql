-- Migration: Fix teacher access to bookings table
-- This migration ensures teachers can properly view all their bookings

-- Drop existing teacher policy for bookings
DROP POLICY IF EXISTS "Teachers can view bookings for their slots" ON public.bookings;

-- Create improved policy for teachers to view their bookings
CREATE POLICY "Teachers can view their bookings" ON public.bookings
  FOR SELECT USING (
    -- Allow teachers to view bookings where they are the teacher
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
    OR
    -- Also allow teachers to view bookings where their email matches (fallback)
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = (
        SELECT email FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  );

-- Add policy for teachers to update their bookings (for status changes, etc.)
CREATE POLICY "Teachers can update their bookings" ON public.bookings
  FOR UPDATE USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
    OR
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = (
        SELECT email FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  );

-- Ensure bookings table has RLS enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create index for better performance on teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id_lookup ON public.bookings(teacher_id);

-- Add a function to help debug teacher access issues
CREATE OR REPLACE FUNCTION debug_teacher_bookings_access()
RETURNS TABLE (
  auth_user_id UUID,
  teacher_id UUID,
  teacher_email TEXT,
  teacher_user_id UUID,
  bookings_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as auth_user_id,
    t.id as teacher_id,
    t.email as teacher_email,
    t.user_id as teacher_user_id,
    COUNT(b.id) as bookings_count
  FROM public.teachers t
  LEFT JOIN public.bookings b ON t.id = b.teacher_id
  WHERE t.user_id = auth.uid() OR t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  GROUP BY t.id, t.email, t.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;