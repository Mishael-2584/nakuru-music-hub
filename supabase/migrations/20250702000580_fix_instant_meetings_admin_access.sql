-- Fix instant_meetings RLS policies to allow admins to create meetings
-- This migration ensures admins can create instant meetings for trial classes

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage all instant meetings" ON public.instant_meetings;

-- Create a more permissive admin policy that checks multiple ways to identify admins
CREATE POLICY "Admins can manage all instant meetings" ON public.instant_meetings
  FOR ALL USING (
    -- Check if user is admin via profiles table
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    ) OR
    -- Check if user is admin via teachers table (admin category)
    auth.uid() IN (
      SELECT user_id FROM public.teachers 
      WHERE category = 'admin'
    ) OR
    -- Check if user is admin via user metadata (fallback)
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Also create a policy specifically for creating instant meetings (more permissive)
CREATE POLICY "Allow instant meeting creation" ON public.instant_meetings
  FOR INSERT WITH CHECK (
    -- Allow authenticated users to create meetings
    auth.role() = 'authenticated' OR
    -- Allow service role
    auth.role() = 'service_role' OR
    -- Allow admins via profiles
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    ) OR
    -- Allow admins via teachers table
    auth.uid() IN (
      SELECT user_id FROM public.teachers 
      WHERE category = 'admin'
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.instant_meetings TO authenticated;
GRANT ALL ON public.instant_meetings TO service_role;
