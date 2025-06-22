-- Fix RLS policies for registrations table
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;

-- Recreate policies with proper permissions
-- Allow anyone to insert registrations (for public registration form)
CREATE POLICY "Anyone can insert registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins to view all registrations
CREATE POLICY "Admins can view all registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update registrations
CREATE POLICY "Admins can update registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to delete registrations
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  ); 