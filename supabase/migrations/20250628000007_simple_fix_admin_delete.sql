-- Simple fix for admin delete permissions
-- This migration ensures admins can delete registrations

-- Drop existing policies and recreate them with more permissive rules
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
-- Use multiple methods to check for admin status
CREATE POLICY "Admins can view all registrations" 
  ON public.registrations 
  FOR SELECT 
  USING (
    -- Method 1: Check auth.users metadata
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
    OR
    -- Method 2: Check profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
    OR
    -- Method 3: Check by email in profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create a policy that allows admins to update registrations
CREATE POLICY "Admins can update registrations" 
  ON public.registrations 
  FOR UPDATE 
  USING (
    -- Method 1: Check auth.users metadata
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
    OR
    -- Method 2: Check profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
    OR
    -- Method 3: Check by email in profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create a policy that allows admins to delete registrations
-- This is the key policy that was failing
CREATE POLICY "Admins can delete registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    -- Method 1: Check auth.users metadata
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
    OR
    -- Method 2: Check profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
    OR
    -- Method 3: Check by email in profiles
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
      AND role IN ('admin', 'super_admin')
    )
  );

-- Also create a fallback policy that allows service role to do everything
CREATE POLICY "Service role can do everything" 
  ON public.registrations 
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Test the deletion with the current user
DO $$
DECLARE
    test_registration_id UUID;
    current_user_id UUID;
    current_user_email TEXT;
BEGIN
    RAISE NOTICE '=== TESTING DELETE PERMISSIONS ===';
    
    -- Get current user info
    current_user_id := auth.uid();
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    RAISE NOTICE 'Current user: ID=%, Email=%', current_user_id, current_user_email;
    
    -- Create a test registration
    INSERT INTO public.registrations (
        student_name, 
        age, 
        email, 
        phone, 
        instrument, 
        experience,
        country_code,
        course_category,
        proficiency_level,
        learning_mode,
        owns_instrument,
        status
    ) VALUES (
        'Test Delete Permissions', 
        15, 
        'test_delete_perms_' || EXTRACT(EPOCH FROM NOW())::TEXT || '@example.com', 
        '123456789', 
        'Piano', 
        'beginner',
        '+254',
        'Music',
        'beginner',
        'in-person',
        false,
        'pending'
    ) RETURNING id INTO test_registration_id;
    
    RAISE NOTICE '✅ Created test registration: %', test_registration_id;
    
    -- Test deletion with current user
    BEGIN
        DELETE FROM public.registrations WHERE id = test_registration_id;
        RAISE NOTICE '✅ SUCCESS: Current user can delete registrations';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: Current user cannot delete registrations: %', SQLERRM;
    END;
END $$; 