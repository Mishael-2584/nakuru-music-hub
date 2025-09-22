-- Create RPC function for efficient quiz submission
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
  total_score INTEGER := 0;
  total_points INTEGER := 0;
  percentage INTEGER;
  passed BOOLEAN;
  quiz_record RECORD;
  answer_data JSONB;
  question_record RECORD;
  correct_answer_count INTEGER := 0;
  total_questions INTEGER := 0;
BEGIN
  -- Get quiz details
  SELECT * INTO quiz_record FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  -- Create quiz submission
  INSERT INTO quiz_submissions (
    quiz_id,
    student_id,
    attempt_number,
    submitted_at,
    status
  ) VALUES (
    quiz_id_param,
    student_id_param,
    1, -- For now, always 1
    NOW(),
    'submitted'
  ) RETURNING id INTO submission_id;

  -- Process each answer
  FOR answer_data IN SELECT * FROM jsonb_array_elements(answers_data)
  LOOP
    -- Get question details
    SELECT * INTO question_record FROM quiz_questions WHERE id = (answer_data->>'question_id')::UUID;
    
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
        (answer_data->>'selected_answer_id')::UUID,
        answer_data->'matching_pairs',
        (answer_data->>'is_correct')::BOOLEAN,
        (answer_data->>'points_earned')::INTEGER
      );

      -- Add to total score
      total_score := total_score + COALESCE((answer_data->>'points_earned')::INTEGER, 0);
      total_points := total_points + COALESCE(question_record.points, 0);
      
      -- Count correct answers
      IF (answer_data->>'is_correct')::BOOLEAN THEN
        correct_answer_count := correct_answer_count + 1;
      END IF;
    END IF;
  END LOOP;

  -- Calculate percentage and pass status
  IF total_points > 0 THEN
    percentage := ROUND((total_score::DECIMAL / total_points::DECIMAL) * 100);
  ELSE
    percentage := 0;
  END IF;
  
  passed := percentage >= COALESCE(quiz_record.passing_score, 60);

  -- Update submission with results
  UPDATE quiz_submissions 
  SET 
    score = total_score,
    percentage = percentage,
    passed = passed
  WHERE id = submission_id;

  -- Return submission details
  RETURN jsonb_build_object(
    'submission_id', submission_id,
    'score', total_score,
    'total_points', total_points,
    'percentage', percentage,
    'passed', passed,
    'correct_answers', correct_answer_count,
    'total_questions', total_questions
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) TO authenticated;
