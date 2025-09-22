-- Fix RLS policies for quiz system to use author_teacher_id
-- Date: 2025-07-02

-- Drop existing policies
DROP POLICY IF EXISTS "Teachers can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can manage quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "Teachers can manage quiz answers" ON quiz_answers;
DROP POLICY IF EXISTS "Teachers can manage matching pairs" ON quiz_matching_pairs;

-- Create corrected policies using author_teacher_id
CREATE POLICY "Teachers can manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      WHERE cp.id = quizzes.post_id
      AND cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      WHERE q.id = quiz_questions.quiz_id
      AND cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can manage quiz answers" ON quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      WHERE qq.id = quiz_answers.question_id
      AND cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can manage matching pairs" ON quiz_matching_pairs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      WHERE qq.id = quiz_matching_pairs.question_id
      AND cp.author_teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())
    )
  );
