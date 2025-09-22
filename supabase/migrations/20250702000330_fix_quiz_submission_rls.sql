-- Fix RLS policies for quiz submissions
-- Date: 2025-07-02

-- Drop existing policies
DROP POLICY IF EXISTS "Students can submit quizzes for enrolled classrooms" ON quiz_submissions;
DROP POLICY IF EXISTS "Students can view their own quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Teachers can view quiz submissions for their classrooms" ON quiz_submissions;

-- Create corrected policies for quiz submissions
CREATE POLICY "Students can submit quizzes for enrolled classrooms" ON quiz_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE q.id = quiz_submissions.quiz_id
      AND ce.student_id = quiz_submissions.student_id
    )
  );

CREATE POLICY "Students can view their own quiz submissions" ON quiz_submissions
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Teachers can view quiz submissions for their classrooms" ON quiz_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN teachers t ON cp.author_teacher_id = t.id
      WHERE q.id = quiz_submissions.quiz_id
      AND t.user_id = auth.uid()
    )
  );

-- Create policy for quiz submission answers
DROP POLICY IF EXISTS "Students can submit quiz answers" ON quiz_submission_answers;
DROP POLICY IF EXISTS "Students can view their own quiz answers" ON quiz_submission_answers;
DROP POLICY IF EXISTS "Teachers can view quiz answers for their classrooms" ON quiz_submission_answers;

CREATE POLICY "Students can submit quiz answers" ON quiz_submission_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE qs.id = quiz_submission_answers.submission_id
      AND ce.student_id = qs.student_id
    )
  );

CREATE POLICY "Students can view their own quiz answers" ON quiz_submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      WHERE qs.id = quiz_submission_answers.submission_id
      AND qs.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can view quiz answers for their classrooms" ON quiz_submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN teachers t ON cp.author_teacher_id = t.id
      WHERE qs.id = quiz_submission_answers.submission_id
      AND t.user_id = auth.uid()
    )
  );
