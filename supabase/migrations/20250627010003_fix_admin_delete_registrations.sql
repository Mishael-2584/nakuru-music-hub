-- Fix admin delete permissions for registrations
-- This migration ensures admins can properly delete registrations

-- First, let's check if RLS is enabled on registrations table
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Service role can do everything" ON public.registrations;

-- Create a simple policy that allows anyone to insert registrations
CREATE POLICY "Anyone can insert registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy that allows authenticated users to view their own registrations
CREATE POLICY "Users can view own registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Create a policy that allows admins to view all registrations
-- Use a more robust admin check
CREATE POLICY "Admins can view all registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' IN ('admin', 'super_admin') OR
        email IN (
          SELECT email FROM public.profiles 
          WHERE role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- Create a policy that allows admins to update registrations
CREATE POLICY "Admins can update registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' IN ('admin', 'super_admin') OR
        email IN (
          SELECT email FROM public.profiles 
          WHERE role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- Create a policy that allows admins to delete registrations
-- This is the key policy that was failing
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' IN ('admin', 'super_admin') OR
        email IN (
          SELECT email FROM public.profiles 
          WHERE role IN ('admin', 'super_admin')
        )
      )
    )
  );

-- Also create a fallback policy that allows service role to do everything
CREATE POLICY "Service role can do everything" 
  ON public.registrations 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      raw_user_meta_data->>'role' IN ('admin', 'super_admin') OR
      email IN (
        SELECT email FROM public.profiles 
        WHERE role IN ('admin', 'super_admin')
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated; 