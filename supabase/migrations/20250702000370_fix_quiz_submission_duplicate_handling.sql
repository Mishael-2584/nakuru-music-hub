-- Fix duplicate quiz submission handling
-- Date: 2025-07-02

CREATE OR REPLACE FUNCTION submit_quiz_complete(
  quiz_id_param UUID,
  student_id_param UUID,
  answers_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_id UUID;
  calculated_score INTEGER := 0;
  calculated_points INTEGER := 0;
  calculated_percentage INTEGER;
  passed BOOLEAN;
  quiz_record RECORD;
  answer_data JSONB;
  question_record RECORD;
  correct_answer_count INTEGER := 0;
  total_questions INTEGER := 0;
  existing_submission RECORD;
  next_attempt_number INTEGER;
BEGIN
  -- Get quiz details
  SELECT * INTO quiz_record FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  -- Check for existing submissions and get next attempt number
  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO next_attempt_number
  FROM quiz_submissions 
  WHERE quiz_id = quiz_id_param AND student_id = student_id_param;

  -- Check if max attempts exceeded
  IF next_attempt_number > COALESCE(quiz_record.max_attempts, 1) THEN
    RETURN jsonb_build_object('error', 'Maximum attempts exceeded');
  END IF;

  -- Create or update quiz submission
  INSERT INTO quiz_submissions (
    quiz_id,
    student_id,
    attempt_number,
    submitted_at,
    status
  ) VALUES (
    quiz_id_param,
    student_id_param,
    next_attempt_number,
    NOW(),
    'submitted'
  ) 
  ON CONFLICT (quiz_id, student_id, attempt_number) 
  DO UPDATE SET
    submitted_at = NOW(),
    status = 'submitted'
  RETURNING id INTO submission_id;

  -- Clear existing answers for this submission
  DELETE FROM quiz_submission_answers WHERE submission_id = submission_id;

  -- Process each answer
  FOR answer_data IN SELECT * FROM jsonb_array_elements(answers_data)
  LOOP
    -- Get question details
    SELECT * INTO question_record FROM quiz_questions WHERE id = (answer_data->>'questionId')::UUID;
    
    IF FOUND THEN
      total_questions := total_questions + 1;
      
      -- Insert answer
      INSERT INTO quiz_submission_answers (
        submission_id,
        question_id,
        selected_answer_id,
        matching_pairs,
        is_correct,
        points_earned
      ) VALUES (
        submission_id,
        question_record.id,
        (answer_data->>'selectedAnswerId')::UUID,
        answer_data->'matchingPairs',
        (answer_data->>'isCorrect')::BOOLEAN,
        (answer_data->>'pointsEarned')::INTEGER
      );

      -- Add to calculated score
      calculated_score := calculated_score + COALESCE((answer_data->>'pointsEarned')::INTEGER, 0);
      calculated_points := calculated_points + COALESCE(question_record.points, 0);
      
      -- Count correct answers
      IF (answer_data->>'isCorrect')::BOOLEAN THEN
        correct_answer_count := correct_answer_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Calculate percentage and pass status
  IF calculated_points > 0 THEN
    calculated_percentage := ROUND((calculated_score::DECIMAL / calculated_points::DECIMAL) * 100);
  ELSE
    calculated_percentage := 0;
  END IF;
  
  passed := calculated_percentage >= COALESCE(quiz_record.passing_score, 60);

  -- Update submission with results
  UPDATE quiz_submissions 
  SET 
    total_score = calculated_score,
    percentage_score = calculated_percentage,
    is_passed = passed
  WHERE id = submission_id;

  -- Return submission details
  RETURN jsonb_build_object(
    'submission_id', submission_id,
    'score', calculated_score,
    'total_points', calculated_points,
    'percentage', calculated_percentage,
    'passed', passed,
    'correct_answers', correct_answer_count,
    'total_questions', total_questions,
    'attempt_number', next_attempt_number
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) TO authenticated;
