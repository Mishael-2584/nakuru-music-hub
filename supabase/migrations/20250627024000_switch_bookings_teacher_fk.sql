-- Migration: Switch bookings.teacher_id to reference teachers(id) instead of auth.users(id)

-- 1. Drop the old foreign key constraint (if it exists)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'bookings'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'teacher_id';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- 2. Add the new foreign key constraint
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- 3. (Optional) Recreate index if needed
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON public.bookings(teacher_id); 