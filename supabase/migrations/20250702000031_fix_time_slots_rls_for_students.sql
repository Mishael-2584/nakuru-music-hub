-- Migration: Fix time_slots RLS policies for students
-- Date: 2025-07-02

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Enable read access for all users" ON public.time_slots;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.time_slots;
DROP POLICY IF EXISTS "Enable update for users based on teacher_id" ON public.time_slots;
DROP POLICY IF EXISTS "Enable delete for users based on teacher_id" ON public.time_slots;

-- Create comprehensive RLS policies for time_slots
-- Allow all users to read available time slots
CREATE POLICY "Enable read access for all users" ON public.time_slots
FOR SELECT USING (true);

-- Allow authenticated users to insert time slots
CREATE POLICY "Enable insert for authenticated users only" ON public.time_slots
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow teachers to update their own time slots
CREATE POLICY "Enable update for users based on teacher_id" ON public.time_slots
FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM public.teachers WHERE id = teacher_id
  )
);

-- Allow teachers to delete their own time slots
CREATE POLICY "Enable delete for users based on teacher_id" ON public.time_slots
FOR DELETE USING (
  auth.uid() IN (
    SELECT user_id FROM public.teachers WHERE id = teacher_id
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY; 