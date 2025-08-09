-- Allow teachers to insert comments in classrooms they teach
-- Date: 2025-07-02

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Teachers insert comments in own classrooms'
  ) THEN
    CREATE POLICY "Teachers insert comments in own classrooms" 
    ON public.classroom_comments
    FOR INSERT
    WITH CHECK (
      author_teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())
      AND post_id IN (
        SELECT cp.id FROM public.classroom_posts cp
        JOIN public.classrooms c ON c.id = cp.classroom_id
        WHERE c.teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())
      )
    );
  END IF;
END $$;