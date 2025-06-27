-- Fix registration insert policy to allow public users to register
-- The current policies only allow admins to view/update, but not public users to insert

-- Add policy for public users to insert registrations
CREATE POLICY "Public users can insert registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true); -- Allow all inserts from public users

-- Also ensure the table is accessible for public reads (for connection testing)
CREATE POLICY "Public users can read registrations count" 
  ON public.registrations 
  FOR SELECT 
  USING (true); -- Allow public to read for connection testing 