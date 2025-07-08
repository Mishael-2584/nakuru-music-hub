-- Migration: Fix time_slots.teacher_id values before adding foreign key

-- 1. Update time_slots.teacher_id to match teachers.id by joining on email
UPDATE public.time_slots ts
SET teacher_id = t.id
FROM public.teachers t, auth.users u
WHERE ts.teacher_id = u.id AND u.email = t.email;

-- 2. Delete any orphaned time_slots rows (no matching teacher)
DELETE FROM public.time_slots ts
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers t WHERE ts.teacher_id = t.id
); 