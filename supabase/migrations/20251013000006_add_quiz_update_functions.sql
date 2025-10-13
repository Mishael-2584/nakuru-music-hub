-- Add RPC functions for updating quizzes
-- Date: 2025-10-13
-- Allows teachers to edit draft quizzes or published quizzes before scheduled time

-- Function to update a quiz
CREATE OR REPLACE FUNCTION update_quiz(
  quiz_id_param UUID,
  title_param TEXT,
  description_param TEXT DEFAULT NULL,
  time_limit_minutes_param INTEGER DEFAULT NULL,
  show_answers_after_param BOOLEAN DEFAULT true,
  show_marks_immediately_param BOOLEAN DEFAULT true,
  passing_score_param INTEGER DEFAULT 60,
  max_attempts_param INTEGER DEFAULT 1,
  scheduled_open_at_param TIMESTAMPTZ DEFAULT NULL,
  status_param TEXT DEFAULT 'draft',
  is_draft_param BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  quiz_record RECORD;
BEGIN
  -- Get the quiz and check permissions
  SELECT q.*, cp.author_teacher_id INTO quiz_record
  FROM quizzes q
  JOIN classroom_posts cp ON q.post_id = cp.id
  WHERE q.id = quiz_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;
  
  -- Check if user is the teacher who created this quiz
  IF NOT EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.id = quiz_record.author_teacher_id
    AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied: You can only edit your own quizzes';
  END IF;
  
  -- Check if quiz can be edited:
  -- 1. Always allowed if draft
  -- 2. Allowed if published but scheduled time hasn't passed yet
  -- 3. NOT allowed if published and scheduled time has passed
  IF quiz_record.is_draft = FALSE 
     AND quiz_record.scheduled_open_at IS NOT NULL 
     AND quiz_record.scheduled_open_at <= NOW() THEN
    RAISE EXCEPTION 'Cannot edit quiz: Quiz has already opened for students';
  END IF;
  
  -- Update the quiz
  UPDATE quizzes SET
    title = title_param,
    description = description_param,
    time_limit_minutes = time_limit_minutes_param,
    show_answers_after = show_answers_after_param,
    show_marks_immediately = show_marks_immediately_param,
    passing_score = passing_score_param,
    max_attempts = max_attempts_param,
    scheduled_open_at = scheduled_open_at_param,
    status = status_param,
    is_draft = is_draft_param,
    updated_at = NOW()
  WHERE id = quiz_id_param;
  
  RETURN TRUE;
END;
$$;

-- Function to delete all questions for a quiz (for re-adding during edit)
CREATE OR REPLACE FUNCTION delete_quiz_questions(
  quiz_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to manage this quiz
  IF NOT EXISTS (
    SELECT 1 FROM quizzes q
    JOIN classroom_posts cp ON q.post_id = cp.id
    JOIN teachers t ON cp.author_teacher_id = t.id
    WHERE q.id = quiz_id_param
    AND t.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Delete all answers first (cascade will handle this, but being explicit)
  DELETE FROM quiz_answers
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id = quiz_id_param
  );
  
  -- Delete all matching pairs
  DELETE FROM quiz_matching_pairs
  WHERE question_id IN (
    SELECT id FROM quiz_questions WHERE quiz_id = quiz_id_param
  );
  
  -- Delete all questions
  DELETE FROM quiz_questions WHERE quiz_id = quiz_id_param;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_quiz(UUID, TEXT, TEXT, INTEGER, BOOLEAN, BOOLEAN, INTEGER, INTEGER, TIMESTAMPTZ, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_quiz_questions(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION update_quiz IS 'Updates a quiz - only allowed for draft quizzes or published quizzes before scheduled time';
COMMENT ON FUNCTION delete_quiz_questions IS 'Deletes all questions for a quiz (used during quiz edit to rebuild questions)';

