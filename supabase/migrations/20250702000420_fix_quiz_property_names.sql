-- Fix property names in quiz RPC function
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
  next_attempt_number INTEGER;
  answer_points INTEGER;
  is_correct_answer BOOLEAN;
  selected_answer_id UUID;
  correct_answer_id UUID;
  matching_pairs_data JSONB;
  correct_matching_pairs JSONB;
  matching_correct BOOLEAN;
  question_id_text TEXT;
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
  RETURNING id INTO new_submission_id;

  -- Clear existing answers for this submission
  DELETE FROM quiz_submission_answers WHERE submission_id = new_submission_id;

  -- Process each answer
  FOR answer_data IN SELECT * FROM jsonb_array_elements(answers_data)
  LOOP
    -- Get question ID as text first - FIXED: use question_id not questionId
    question_id_text := answer_data->>'question_id';
    
    -- Debug: Log the question ID being processed
    RAISE NOTICE 'Processing question ID: %', question_id_text;
    
    -- Get question details
    SELECT * INTO question_record FROM quiz_questions WHERE id = question_id_text::UUID;
    
    IF FOUND THEN
      RAISE NOTICE 'Found question: %', question_record.question_text;
      total_questions := total_questions + 1;
      
      -- Initialize variables
      answer_points := 0;
      is_correct_answer := false;
      
      -- Handle different question types
      IF question_record.question_type = 'multiple_choice' OR question_record.question_type = 'true_false' THEN
        -- Get selected answer ID - FIXED: use selected_answer_id not selectedAnswerId
        selected_answer_id := CASE 
          WHEN (answer_data->>'selected_answer_id') IS NOT NULL AND (answer_data->>'selected_answer_id') != 'null'
          THEN (answer_data->>'selected_answer_id')::UUID
          ELSE NULL
        END;
        
        RAISE NOTICE 'Selected answer ID: %', selected_answer_id;
        
        -- Find correct answer
        SELECT id INTO correct_answer_id 
        FROM quiz_answers 
        WHERE question_id = question_record.id AND is_correct = true 
        LIMIT 1;
        
        RAISE NOTICE 'Correct answer ID: %', correct_answer_id;
        
        -- Check if answer is correct
        IF selected_answer_id IS NOT NULL AND correct_answer_id IS NOT NULL THEN
          is_correct_answer := (selected_answer_id = correct_answer_id);
        END IF;
        
        RAISE NOTICE 'Is correct: %', is_correct_answer;
        
        -- Calculate points
        IF is_correct_answer THEN
          answer_points := COALESCE(question_record.points, 0);
        END IF;
        
      ELSIF question_record.question_type = 'matching' THEN
        -- Get student's matching pairs - FIXED: use matching_pairs not matchingPairs
        matching_pairs_data := COALESCE(answer_data->'matching_pairs', '[]'::jsonb);
        
        -- Get correct matching pairs
        SELECT jsonb_agg(
          jsonb_build_object('left', left_item, 'right', right_item)
          ORDER BY order_index
        ) INTO correct_matching_pairs
        FROM quiz_matching_pairs 
        WHERE question_id = question_record.id;
        
        -- Check if matching is correct (simplified comparison)
        matching_correct := (matching_pairs_data = correct_matching_pairs);
        is_correct_answer := matching_correct;
        
        -- Calculate points
        IF is_correct_answer THEN
          answer_points := COALESCE(question_record.points, 0);
        END IF;
      END IF;
      
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
        selected_answer_id,
        matching_pairs_data,
        is_correct_answer,
        answer_points
      );

      RAISE NOTICE 'Inserted answer with points: %', answer_points;

      -- Add to calculated score
      calculated_score := calculated_score + answer_points;
      calculated_points := calculated_points + COALESCE(question_record.points, 0);
      
      -- Count correct answers
      IF is_correct_answer THEN
        correct_answer_count := correct_answer_count + 1;
      END IF;
    ELSE
      RAISE NOTICE 'Question not found for ID: %', question_id_text;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total questions processed: %', total_questions;
  RAISE NOTICE 'Total score: %, Total points: %', calculated_score, calculated_points;

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
  WHERE id = new_submission_id;

  -- Return submission details
  RETURN jsonb_build_object(
    'submission_id', new_submission_id,
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
