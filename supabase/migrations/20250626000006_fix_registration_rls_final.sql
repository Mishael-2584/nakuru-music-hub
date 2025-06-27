-- Fix registration table RLS policies - Final attempt
-- This migration ensures that registrations work properly for both public users and admins

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Service role can do everything" ON public.registrations;

-- Create a simple policy that allows anyone to insert registrations
-- This is needed for the public registration form
CREATE POLICY "Anyone can insert registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy that allows authenticated users to view their own registrations
-- This is useful if students want to check their registration status
CREATE POLICY "Users can view own registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Create a policy that allows admins to view all registrations
-- We'll use a simpler check that doesn't depend on the profiles table
CREATE POLICY "Admins can view all registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create a policy that allows admins to update registrations
CREATE POLICY "Admins can update registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Create a policy that allows admins to delete registrations
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Also create a fallback policy that allows service role to do everything
-- This is needed for the Edge Functions
CREATE POLICY "Service role can do everything" 
  ON public.registrations 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role'); 