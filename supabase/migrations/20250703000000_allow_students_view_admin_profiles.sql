-- Allow students to view admin profiles for messaging
-- This policy allows authenticated users to view admin profiles for messaging functionality

CREATE POLICY "Users can view admin profiles for messaging" 
  ON public.profiles 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    role IN ('admin', 'super_admin')
  );

-- Add comment to explain the policy
COMMENT ON POLICY "Users can view admin profiles for messaging" ON public.profiles IS 
  'Allows authenticated users to view admin profiles for messaging functionality'; 