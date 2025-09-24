-- Fix RLS policy for students to view their own quiz submissions
-- Date: 2025-07-02

-- Drop the existing policy
DROP POLICY IF EXISTS "Students can view their own quiz submissions" ON quiz_submissions;

-- Create corrected policy - student_id in quiz_submissions is actually the user_id (profile ID)
CREATE POLICY "Students can view their own quiz submissions" ON quiz_submissions
  FOR SELECT USING (
    student_id = auth.uid()
  );

-- Also fix the quiz submission answers policy to be consistent
DROP POLICY IF EXISTS "Students can view their own quiz answers" ON quiz_submission_answers;

CREATE POLICY "Students can view their own quiz answers" ON quiz_submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      WHERE qs.id = quiz_submission_answers.submission_id
      AND qs.student_id = auth.uid()
    )
  );
