-- Migration: Switch time_slots.teacher_id to reference teachers(id) instead of auth.users(id)

-- Check if the foreign key constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'time_slots_teacher_id_fkey' 
    AND table_name = 'time_slots'
  ) THEN
    -- Add the new foreign key constraint
    ALTER TABLE public.time_slots
      ADD CONSTRAINT time_slots_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. (Optional) Recreate index if needed
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_id ON public.time_slots(teacher_id); 