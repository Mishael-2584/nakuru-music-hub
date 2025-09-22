-- Fix quiz submission RPC function to use correct property names
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
  new_submission_id UUID;
  calculated_score INTEGER := 0;
  calculated_points INTEGER := 0;
  calculated_percentage INTEGER;
  passed BOOLEAN;
  quiz_record RECORD;
  answer_data JSONB;
  question_record RECORD;
  correct_answer_count INTEGER := 0;
  total_questions INTEGER := 0;
  is_correct_answer BOOLEAN;
  answer_points INTEGER;
BEGIN
  -- Get quiz details
  SELECT * INTO quiz_record FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
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
    1, -- For now, always 1
    NOW(),
    'submitted'
  ) 
  ON CONFLICT (quiz_id, student_id) 
  DO UPDATE SET
    submitted_at = NOW(),
    status = 'submitted'
  RETURNING id INTO new_submission_id;

  -- Delete old answers if updating
  DELETE FROM quiz_submission_answers WHERE submission_id = new_submission_id;

  -- Process each answer
  FOR answer_data IN SELECT * FROM jsonb_array_elements(answers_data)
  LOOP
    -- Get question details
    SELECT * INTO question_record FROM quiz_questions WHERE id = (answer_data->>'question_id')::UUID;
    
    IF FOUND THEN
      total_questions := total_questions + 1;
      
      -- Calculate if answer is correct and points earned
      is_correct_answer := (answer_data->>'is_correct')::BOOLEAN;
      answer_points := COALESCE((answer_data->>'points_earned')::INTEGER, 0);
      
      -- Insert answer
      INSERT INTO quiz_submission_answers (
        submission_id,
        question_id,
        selected_answer_id,
        matching_pairs,
        is_correct,
        points_earned
      ) VALUES (
        new_submission_id,
        question_record.id,
        (answer_data->>'selected_answer_id')::UUID,
        answer_data->'matching_pairs',
        is_correct_answer,
        answer_points
      );

      -- Add to total score
      calculated_score := calculated_score + answer_points;
      calculated_points := calculated_points + COALESCE(question_record.points, 0);
      
      -- Count correct answers
      IF is_correct_answer THEN
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
    score = calculated_score,
    percentage_score = calculated_percentage,
    is_passed = passed
  WHERE id = new_submission_id;

  -- Return submission details
  RETURN jsonb_build_object(
    'submission_id', new_submission_id,
    'score', calculated_score,
    'total_points', calculated_points,
    'percentage', calculated_percentage,
    'passed', passed,
    'correct_answers', correct_answer_count,
    'total_questions', total_questions
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) TO authenticated;
