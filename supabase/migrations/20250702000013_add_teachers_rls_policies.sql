-- Migration: Add RLS policies for teachers table
-- This migration adds the missing RLS policies that allow teachers to access their own records

-- Enable RLS on teachers table if not already enabled
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teachers;
DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage all teachers" ON public.teachers;

-- Create policies for teachers to access their own records
CREATE POLICY "Teachers can view own profile" 
  ON public.teachers 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can update own profile" 
  ON public.teachers 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create policies for admins to manage all teachers
CREATE POLICY "Admins can view all teachers" 
  ON public.teachers 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all teachers" 
  ON public.teachers 
  FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Create policy for service role (Edge Functions)
CREATE POLICY "Service role can manage teachers" 
  ON public.teachers 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');