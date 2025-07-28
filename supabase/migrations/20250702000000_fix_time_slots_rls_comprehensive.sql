-- Migration: Comprehensive fix for time_slots RLS policies
-- This migration addresses all conflicts and ensures all teachers can add time slots

-- 1. First, ensure all teachers have a user_id
UPDATE public.teachers t
SET user_id = u.id
FROM auth.users u
WHERE t.email = u.email AND t.user_id IS NULL;

-- 2. Ensure time_slots.teacher_id references teachers.id correctly
-- Update any time_slots that still reference auth.users instead of teachers
UPDATE public.time_slots ts
SET teacher_id = t.id
FROM public.teachers t, auth.users u
WHERE ts.teacher_id = u.id AND u.email = t.email;

-- 3. Clean up orphaned time_slots
DELETE FROM public.time_slots ts
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE ts.teacher_id = t.id
);

-- 4. Drop all existing time_slots policies to start fresh
DROP POLICY IF EXISTS "Teachers can manage their own time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Students can view available time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Admins can manage time slots" ON public.time_slots;
DROP POLICY IF EXISTS "Service role can manage all time slots" ON public.time_slots;

-- 5. Create comprehensive RLS policies for time_slots
CREATE POLICY "Teachers can manage their own time slots" ON public.time_slots
  FOR ALL
  USING (
    -- Primary check: teacher_id matches a teacher record where user_id matches auth.uid()
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
    OR
    -- Fallback for backward compatibility: direct auth.uid() match
    teacher_id = auth.uid()
    OR
    -- Allow admins to manage all time slots
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- 6. Create policy for students to view available time slots
CREATE POLICY "Students can view available time slots" ON public.time_slots
  FOR SELECT 
  USING (is_available = true);

-- 7. Create policy for service role (for Edge Functions)
CREATE POLICY "Service role can manage all time slots" ON public.time_slots
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 8. Ensure the foreign key constraint exists
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_slots_teacher_id_fkey'
    ) THEN
        ALTER TABLE public.time_slots
        ADD CONSTRAINT time_slots_teacher_id_fkey 
        FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 9. Recreate index for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_id ON public.time_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON public.time_slots(is_available); 