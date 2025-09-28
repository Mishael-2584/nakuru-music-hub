-- Migration: Fix RLS policies for instant_meetings table
-- The current policies reference auth.uid() and profiles table which doesn't match the actual user system
-- This migration updates the policies to work with the actual teachers and students tables

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Hosts can manage their own instant meetings" ON public.instant_meetings;
DROP POLICY IF EXISTS "Participants can view invited or public instant meetings" ON public.instant_meetings;
DROP POLICY IF EXISTS "Admins can manage all instant meetings" ON public.instant_meetings;
DROP POLICY IF EXISTS "Service role can manage instant meetings" ON public.instant_meetings;

-- Create new RLS policies that work with the actual user system

-- Hosts can manage their own meetings (using user_id from teachers table)
CREATE POLICY "Hosts can manage their own instant meetings" ON public.instant_meetings
  FOR ALL USING (
    host_id IN (
      SELECT user_id FROM public.teachers WHERE user_id = auth.uid()
    ) OR
    host_id = auth.uid()
  );

-- Participants can view meetings they're invited to or public meetings
CREATE POLICY "Participants can view invited or public instant meetings" ON public.instant_meetings
  FOR SELECT USING (
    is_public = true OR
    auth.uid() = ANY(participants) OR
    host_id = auth.uid() OR
    host_id IN (
      SELECT user_id FROM public.teachers WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.teachers WHERE category = 'admin'
    )
  );

-- Admins can manage all instant meetings (teachers with admin category)
CREATE POLICY "Admins can manage all instant meetings" ON public.instant_meetings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.teachers WHERE category = 'admin'
    )
  );

-- Service role can manage all instant meetings (for Edge Functions)
CREATE POLICY "Service role can manage instant meetings" ON public.instant_meetings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.instant_meetings TO authenticated;
GRANT ALL ON public.instant_meetings TO service_role;
