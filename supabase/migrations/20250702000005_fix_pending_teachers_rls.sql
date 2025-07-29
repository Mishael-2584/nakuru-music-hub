-- Fix RLS policies for pending_teachers table
-- This migration adds proper RLS policies to allow teacher registration and admin management

-- Enable RLS on pending_teachers table (if not already enabled)
ALTER TABLE public.pending_teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can view all pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can update pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can delete pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "Users can view own pending teacher application" ON public.pending_teachers;

-- Create policy to allow anyone to insert pending teacher applications
-- This is needed for the public teacher registration form
CREATE POLICY "Anyone can insert pending teachers" 
  ON public.pending_teachers 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow users to view their own pending teacher application
CREATE POLICY "Users can view own pending teacher application" 
  ON public.pending_teachers 
  FOR SELECT 
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Create policy to allow admins to view all pending teacher applications
CREATE POLICY "Admins can view all pending teachers" 
  ON public.pending_teachers 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create policy to allow admins to update pending teacher applications
CREATE POLICY "Admins can update pending teachers" 
  ON public.pending_teachers 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create policy to allow admins to delete pending teacher applications
CREATE POLICY "Admins can delete pending teachers" 
  ON public.pending_teachers 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Also fix RLS policies for teachers table
-- Enable RLS on teachers table (if not already enabled)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can delete teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teachers;

-- Create policy to allow admins to view all teachers
CREATE POLICY "Admins can view all teachers" 
  ON public.teachers 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create policy to allow admins to update teachers
CREATE POLICY "Admins can update teachers" 
  ON public.teachers 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create policy to allow admins to delete teachers
CREATE POLICY "Admins can delete teachers" 
  ON public.teachers 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create policy to allow teachers to view their own profile
CREATE POLICY "Teachers can view own profile" 
  ON public.teachers 
  FOR SELECT 
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );