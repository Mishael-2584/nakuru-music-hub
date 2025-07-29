-- Migration: Fix RLS policies for bookings table
-- This migration ensures teachers can view bookings for their slots and students can create bookings

-- Drop existing bookings policies
DROP POLICY IF EXISTS "Teachers can view bookings for their slots" ON public.bookings;
DROP POLICY IF EXISTS "Students can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Students can update their own bookings" ON public.bookings;

-- Create corrected policies for bookings
CREATE POLICY "Teachers can view bookings for their slots" ON public.bookings
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own bookings" ON public.bookings
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    )
  );

-- Add policy for admins to manage all bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Add policy for service role (Edge Functions)
CREATE POLICY "Service role can manage bookings" ON public.bookings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');