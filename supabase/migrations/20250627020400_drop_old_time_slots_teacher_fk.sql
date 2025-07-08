-- Migration: Drop old foreign key constraint on time_slots.teacher_id

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'time_slots'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'teacher_id';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.time_slots DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$; 