-- Add missing INSERT policy for teachers table
-- This migration adds the INSERT policy that was missing for admins to create approved teachers

-- Add INSERT policy for admins to create teachers
CREATE POLICY "Admins can insert teachers" 
  ON public.teachers 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );