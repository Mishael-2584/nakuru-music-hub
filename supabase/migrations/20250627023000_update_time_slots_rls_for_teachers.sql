-- Migration: Update RLS policy for time_slots to use teachers.user_id

DROP POLICY IF EXISTS "Teachers can manage their own time slots" ON public.time_slots;

CREATE POLICY "Teachers can manage their own time slots" ON public.time_slots
  FOR ALL
  USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  ); 