-- Fix quiz RLS policies to correctly identify students by auth.uid()
-- Date: 2025-10-31
-- Issue: Students couldn't view quizzes because RLS was comparing student_id with auth.uid()
-- but student_id is from students table, not auth.uid()

-- Drop existing student quiz viewing policy
DROP POLICY IF EXISTS "Students can view quizzes for enrolled classrooms" ON quizzes;

-- Create corrected policy that joins through students table
CREATE POLICY "Students can view quizzes for enrolled classrooms" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      JOIN students s ON ce.student_id = s.id
      WHERE cp.id = quizzes.post_id
      AND s.user_id = auth.uid()
    )
  );

-- Also fix quiz questions policy
DROP POLICY IF EXISTS "Students can view quiz questions" ON quiz_questions;

CREATE POLICY "Students can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      JOIN students s ON ce.student_id = s.id
      WHERE q.id = quiz_questions.quiz_id
      AND s.user_id = auth.uid()
    )
  );

-- Fix quiz answers policy
DROP POLICY IF EXISTS "Students can view quiz answers" ON quiz_answers;

CREATE POLICY "Students can view quiz answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      JOIN students s ON ce.student_id = s.id
      WHERE qq.id = quiz_answers.question_id
      AND s.user_id = auth.uid()
    )
  );

-- Fix matching pairs policy
DROP POLICY IF EXISTS "Students can view matching pairs" ON quiz_matching_pairs;

CREATE POLICY "Students can view matching pairs" ON quiz_matching_pairs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      JOIN students s ON ce.student_id = s.id
      WHERE qq.id = quiz_matching_pairs.question_id
      AND s.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Students can view quizzes for enrolled classrooms" ON quizzes IS 
'Allows students to view quizzes in classrooms they are enrolled in. Fixed to correctly join through students table to match auth.uid() with user_id.';
