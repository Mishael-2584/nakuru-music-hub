-- Allow teachers to grade students who did not submit (e.g. score of 0)

ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS no_submission BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.assignment_submissions.no_submission IS
  'True when the teacher graded without a student submission (e.g. 0 for missing work).';

-- Teachers may create submission rows solely for grading (no student upload)
CREATE POLICY "Teachers can insert submissions for grading"
  ON public.assignment_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.classroom_posts cp
      WHERE cp.id = assignment_submissions.post_id
        AND cp.author_teacher_id IN (
          SELECT id FROM public.teachers WHERE user_id = auth.uid()
        )
    )
  );
