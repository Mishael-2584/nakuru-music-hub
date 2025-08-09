-- Allow students to select posts in classrooms they are enrolled in
-- Date: 2025-07-02

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classroom_posts' AND policyname = 'Students view posts in enrolled classrooms'
  ) THEN
    CREATE POLICY "Students view posts in enrolled classrooms" 
    ON public.classroom_posts
    FOR SELECT
    USING (
      classroom_id IN (
        SELECT c.id
        FROM public.classrooms c
        JOIN public.classroom_enrollments ce ON ce.classroom_id = c.id
        WHERE ce.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
      )
    );
  END IF;
END $$;