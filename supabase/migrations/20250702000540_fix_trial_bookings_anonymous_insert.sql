-- Fix trial_bookings RLS policies to allow anonymous users to create trial bookings
-- This enables the trial booking form to work for non-authenticated users

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Teachers can manage assigned trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Admins can manage all trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Service role can manage trial bookings" ON public.trial_bookings;

-- Create new RLS policies

-- Allow anonymous users to create trial bookings (for the public form)
CREATE POLICY "Allow anonymous users to create trial bookings" ON public.trial_bookings
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read trial bookings
CREATE POLICY "Allow authenticated users to read trial bookings" ON public.trial_bookings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Teachers can view and manage trial bookings assigned to them
CREATE POLICY "Teachers can manage assigned trial bookings" ON public.trial_bookings
  FOR ALL USING (
    assigned_teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all trial bookings
CREATE POLICY "Admins can manage all trial bookings" ON public.trial_bookings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.teachers WHERE category = 'admin'
    )
  );

-- Service role can manage all trial bookings (for API operations)
CREATE POLICY "Service role can manage trial bookings" ON public.trial_bookings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.trial_bookings TO anon;
GRANT ALL ON public.trial_bookings TO authenticated;
GRANT ALL ON public.trial_bookings TO service_role;
