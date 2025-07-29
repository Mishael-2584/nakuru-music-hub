-- Migration: Fix student access to time slots with teacher information
-- This migration ensures students can view time slots and teacher information for booking

-- Drop existing time_slots policies for students
DROP POLICY IF EXISTS "Students can view available time slots" ON public.time_slots;

-- Create a more comprehensive policy for students to view time slots
CREATE POLICY "Students can view available time slots" ON public.time_slots
  FOR SELECT 
  USING (
    is_available = true 
    AND 
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE status IN ('approved', 'active')
    )
  );

-- Also ensure students can view teacher information for booking
-- Add RLS policy for students to view teacher profiles (for booking purposes)
DROP POLICY IF EXISTS "Students can view teachers for booking" ON public.teachers;

CREATE POLICY "Students can view teachers for booking" ON public.teachers
  FOR SELECT 
  USING (
    status IN ('approved', 'active')
  );

-- Ensure the foreign key relationship is properly set up
DO $$
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_slots_teacher_id_fkey'
        AND table_name = 'time_slots'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.time_slots
        ADD CONSTRAINT time_slots_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index for better performance on teacher lookups
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_status ON public.time_slots(teacher_id, is_available);