-- Migration: Switch time_slots.teacher_id to reference teachers(id) instead of auth.users(id)

-- 2. Add the new foreign key constraint
ALTER TABLE public.time_slots
  ADD CONSTRAINT time_slots_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- 3. (Optional) Recreate index if needed
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_id ON public.time_slots(teacher_id); 