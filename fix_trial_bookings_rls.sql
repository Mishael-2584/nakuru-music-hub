-- Fix trial_bookings RLS policies manually
-- This script will ensure anonymous users can create trial bookings

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'trial_bookings';

-- Drop all existing policies on trial_bookings
DROP POLICY IF EXISTS "Teachers can manage assigned trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Admins can manage all trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Service role can manage trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Allow anonymous users to create trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Allow authenticated users to read trial bookings" ON public.trial_bookings;
DROP POLICY IF EXISTS "Teachers can manage assigned trial bookings" ON public.trial_bookings;

-- Create the correct policies
-- 1. Allow anonymous users to INSERT (create trial bookings)
CREATE POLICY "anon_insert_trial_bookings" ON public.trial_bookings
    FOR INSERT TO anon
    WITH CHECK (true);

-- 2. Allow authenticated users to SELECT (read trial bookings)
CREATE POLICY "authenticated_select_trial_bookings" ON public.trial_bookings
    FOR SELECT TO authenticated
    USING (true);

-- 3. Allow teachers to manage their assigned trial bookings
CREATE POLICY "teachers_manage_assigned_trial_bookings" ON public.trial_bookings
    FOR ALL TO authenticated
    USING (
        assigned_teacher_id IN (
            SELECT id FROM public.teachers WHERE user_id = auth.uid()
        )
    );

-- 4. Allow admins to manage all trial bookings
CREATE POLICY "admins_manage_all_trial_bookings" ON public.trial_bookings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE user_id = auth.uid()
        )
    );

-- 5. Allow service role to manage all trial bookings
CREATE POLICY "service_role_manage_trial_bookings" ON public.trial_bookings
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.trial_bookings TO anon;
GRANT ALL ON public.trial_bookings TO authenticated;
GRANT ALL ON public.trial_bookings TO service_role;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'trial_bookings';
