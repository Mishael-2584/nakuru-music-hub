-- Create RPC functions for quiz creation to bypass RLS issues
-- Date: 2025-07-02

-- Function to create a quiz
CREATE OR REPLACE FUNCTION create_quiz(
  post_id_param UUID,
  title_param TEXT,
  description_param TEXT DEFAULT NULL,
  time_limit_minutes_param INTEGER DEFAULT NULL,
  show_answers_after_param BOOLEAN DEFAULT true,
  show_marks_immediately_param BOOLEAN DEFAULT true,
  passing_score_param INTEGER DEFAULT 60,
  max_attempts_param INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quiz_id UUID;
BEGIN
  -- Check if user is a teacher and has permission to create posts in this classroom
  IF NOT EXISTS (
    SELECT 1 FROM classroom_posts cp
    JOIN teachers t ON cp.author_teacher_id = t.id
    WHERE cp.id = post_id_param
    AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied: You can only create quizzes for your own posts';
  END IF;

  -- Insert the quiz
  INSERT INTO quizzes (
    post_id,
    title,
    description,
    time_limit_minutes,
    show_answers_after,
    show_marks_immediately,
    passing_score,
    max_attempts
  ) VALUES (
    post_id_param,
    title_param,
    description_param,
    time_limit_minutes_param,
    show_answers_after_param,
    show_marks_immediately_param,
    passing_score_param,
    max_attempts_param
  ) RETURNING id INTO quiz_id;

  RETURN quiz_id;
END;
$$;

-- Function to create quiz questions
CREATE OR REPLACE FUNCTION create_quiz_questions(
  quiz_id_param UUID,
  questions_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  question_data JSONB;
  question_id UUID;
BEGIN
  -- Check if user has permission to manage this quiz
  IF NOT EXISTS (
    SELECT 1 FROM quizzes q
    JOIN classroom_posts cp ON q.post_id = cp.id
    JOIN teachers t ON cp.author_teacher_id = t.id
    WHERE q.id = quiz_id_param
    AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied: You can only manage quizzes for your own posts';
  END IF;

  -- Insert questions
  FOR question_data IN SELECT * FROM jsonb_array_elements(questions_data)
  LOOP
    INSERT INTO quiz_questions (
      quiz_id,
      question_text,
      question_type,
      points,
      order_index
    ) VALUES (
      quiz_id_param,
      question_data->>'question_text',
      question_data->>'question_type',
      (question_data->>'points')::INTEGER,
      (question_data->>'order_index')::INTEGER
    ) RETURNING id INTO question_id;

    -- Insert answers for multiple choice and true/false
    IF question_data->>'question_type' IN ('multiple_choice', 'true_false') THEN
      INSERT INTO quiz_answers (question_id, answer_text, is_correct, order_index)
      SELECT 
        question_id,
        answer->>'answer_text',
        (answer->>'is_correct')::BOOLEAN,
        (answer->>'order_index')::INTEGER
      FROM jsonb_array_elements(question_data->'answers') AS answer;
    END IF;

    -- Insert matching pairs for matching questions
    IF question_data->>'question_type' = 'matching' THEN
      INSERT INTO quiz_matching_pairs (question_id, left_item, right_item, order_index)
      SELECT 
        question_id,
        pair->>'left_item',
        pair->>'right_item',
        (pair->>'order_index')::INTEGER
      FROM jsonb_array_elements(question_data->'matching_pairs') AS pair;
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_quiz(UUID, TEXT, TEXT, INTEGER, BOOLEAN, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_quiz_questions(UUID, JSONB) TO authenticated;
