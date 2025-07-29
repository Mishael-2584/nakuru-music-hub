-- Fix admin RLS policies to check profiles table instead of user metadata
-- This migration updates the RLS policies to properly detect admin users

-- Drop existing admin policies for pending_teachers
DROP POLICY IF EXISTS "Admins can view all pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can update pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can delete pending teachers" ON public.pending_teachers;

-- Create new admin policies for pending_teachers that check profiles table
CREATE POLICY "Admins can view all pending teachers" 
  ON public.pending_teachers 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update pending teachers" 
  ON public.pending_teachers 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete pending teachers" 
  ON public.pending_teachers 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Drop existing admin policies for teachers
DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON public.teachers;

-- Create new admin policies for teachers that check profiles table
CREATE POLICY "Admins can view all teachers" 
  ON public.teachers 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update teachers" 
  ON public.teachers 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete teachers" 
  ON public.teachers 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );