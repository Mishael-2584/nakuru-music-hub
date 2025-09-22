-- Quiz System Database Schema
-- This migration creates tables for quizzes, questions, answers, and submissions

-- Quiz table (extends classroom_posts for quiz assignments)
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT NULL, -- NULL means no time limit
  show_answers_after BOOLEAN DEFAULT true, -- Whether to show correct answers after submission
  show_marks_immediately BOOLEAN DEFAULT true, -- Whether to show marks immediately
  passing_score INTEGER DEFAULT 60, -- Percentage required to pass
  max_attempts INTEGER DEFAULT 1, -- Maximum number of attempts allowed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'matching')),
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz answers table (for multiple choice and true/false)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz matching pairs table (for matching questions)
CREATE TABLE IF NOT EXISTS quiz_matching_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  left_item TEXT NOT NULL,
  right_item TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  total_score INTEGER DEFAULT 0,
  percentage_score DECIMAL(5,2) DEFAULT 0,
  is_passed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(quiz_id, student_id, attempt_number)
);

-- Quiz submission answers table
CREATE TABLE IF NOT EXISTS quiz_submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_answer_id UUID REFERENCES quiz_answers(id) ON DELETE CASCADE, -- For multiple choice and true/false
  matching_pairs JSONB DEFAULT '[]'::jsonb, -- For matching questions: [{"left": "item1", "right": "item2"}]
  is_correct BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_post_id ON quizzes(post_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_matching_pairs_question_id ON quiz_matching_pairs(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_student ON quiz_submissions(quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submission_answers_submission ON quiz_submission_answers(submission_id);

-- RLS Policies for quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_matching_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submission_answers ENABLE ROW LEVEL SECURITY;

-- Teachers can manage quizzes for their classrooms
CREATE POLICY "Teachers can manage quizzes for their classrooms" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE cp.id = quizzes.post_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage quiz questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE q.id = quiz_questions.quiz_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage quiz answers" ON quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE qq.id = quiz_answers.question_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can manage matching pairs" ON quiz_matching_pairs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE qq.id = quiz_matching_pairs.question_id
      AND t.user_id = auth.uid()
    )
  );

-- Students can view quizzes for enrolled classrooms
CREATE POLICY "Students can view quizzes for enrolled classrooms" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classroom_posts cp
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE cp.id = quizzes.post_id
      AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view quiz questions" ON quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE q.id = quiz_questions.quiz_id
      AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view quiz answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE qq.id = quiz_answers.question_id
      AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view matching pairs" ON quiz_matching_pairs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON qq.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE qq.id = quiz_matching_pairs.question_id
      AND ce.student_id = auth.uid()
    )
  );

-- Students can submit quizzes
CREATE POLICY "Students can submit quizzes" ON quiz_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE q.id = quiz_submissions.quiz_id
      AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can submit quiz answers" ON quiz_submission_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classroom_enrollments ce ON cp.classroom_id = ce.classroom_id
      WHERE qs.id = quiz_submission_answers.submission_id
      AND ce.student_id = auth.uid()
    )
  );

-- Teachers can view all submissions for their quizzes
CREATE POLICY "Teachers can view quiz submissions" ON quiz_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE q.id = quiz_submissions.quiz_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view submission answers" ON quiz_submission_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_submissions qs
      JOIN quizzes q ON qs.quiz_id = q.id
      JOIN classroom_posts cp ON q.post_id = cp.id
      JOIN classrooms c ON cp.classroom_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE qs.id = quiz_submission_answers.submission_id
      AND t.user_id = auth.uid()
    )
  );

-- Function to automatically grade quiz submissions
CREATE OR REPLACE FUNCTION grade_quiz_submission(submission_id_param UUID)
RETURNS TABLE (
  total_score INTEGER,
  percentage_score DECIMAL(5,2),
  is_passed BOOLEAN
) AS $$
DECLARE
  quiz_record RECORD;
  total_possible_points INTEGER := 0;
  earned_points INTEGER := 0;
  percentage DECIMAL(5,2);
  passed BOOLEAN := false;
BEGIN
  -- Get quiz details
  SELECT q.passing_score INTO quiz_record
  FROM quiz_submissions qs
  JOIN quizzes q ON qs.quiz_id = q.id
  WHERE qs.id = submission_id_param;

  -- Calculate total possible points
  SELECT COALESCE(SUM(qq.points), 0) INTO total_possible_points
  FROM quiz_submissions qs
  JOIN quizzes q ON qs.quiz_id = q.id
  JOIN quiz_questions qq ON q.id = qq.quiz_id
  WHERE qs.id = submission_id_param;

  -- Calculate earned points
  SELECT COALESCE(SUM(qsa.points_earned), 0) INTO earned_points
  FROM quiz_submission_answers qsa
  WHERE qsa.submission_id = submission_id_param;

  -- Calculate percentage
  IF total_possible_points > 0 THEN
    percentage := (earned_points::DECIMAL / total_possible_points::DECIMAL) * 100;
  ELSE
    percentage := 0;
  END IF;

  -- Check if passed
  passed := percentage >= quiz_record.passing_score;

  -- Update submission
  UPDATE quiz_submissions
  SET 
    total_score = earned_points,
    percentage_score = percentage,
    is_passed = passed,
    status = 'graded',
    updated_at = now()
  WHERE id = submission_id_param;

  -- Return results
  total_score := earned_points;
  percentage_score := percentage;
  is_passed := passed;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get quiz with questions and answers
CREATE OR REPLACE FUNCTION get_quiz_with_questions(quiz_id_param UUID)
RETURNS TABLE (
  quiz_id UUID,
  quiz_title TEXT,
  quiz_description TEXT,
  time_limit_minutes INTEGER,
  show_answers_after BOOLEAN,
  show_marks_immediately BOOLEAN,
  passing_score INTEGER,
  max_attempts INTEGER,
  question_id UUID,
  question_text TEXT,
  question_type TEXT,
  question_points INTEGER,
  question_order INTEGER,
  answer_id UUID,
  answer_text TEXT,
  answer_is_correct BOOLEAN,
  answer_order INTEGER,
  matching_left TEXT,
  matching_right TEXT,
  matching_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id as quiz_id,
    q.title as quiz_title,
    q.description as quiz_description,
    q.time_limit_minutes,
    q.show_answers_after,
    q.show_marks_immediately,
    q.passing_score,
    q.max_attempts,
    qq.id as question_id,
    qq.question_text,
    qq.question_type,
    qq.points as question_points,
    qq.order_index as question_order,
    qa.id as answer_id,
    qa.answer_text,
    qa.is_correct as answer_is_correct,
    qa.order_index as answer_order,
    qmp.left_item as matching_left,
    qmp.right_item as matching_right,
    qmp.order_index as matching_order
  FROM quizzes q
  LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
  LEFT JOIN quiz_answers qa ON qq.id = qa.question_id
  LEFT JOIN quiz_matching_pairs qmp ON qq.id = qmp.question_id
  WHERE q.id = quiz_id_param
  ORDER BY qq.order_index, qa.order_index, qmp.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION grade_quiz_submission(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_with_questions(UUID) TO authenticated;
