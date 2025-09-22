-- Debug quiz grading RPC function with detailed logging
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
  calculated_percentage DECIMAL(5,2);
  passed BOOLEAN;
  quiz_record RECORD;
  answer_data JSONB;
  question_record RECORD;
  correct_answer_count INTEGER := 0;
  total_questions INTEGER := 0;
  is_correct_answer BOOLEAN;
  answer_points INTEGER;
  selected_ans_id UUID;
  correct_ans_check BOOLEAN;
  question_pts INTEGER;
BEGIN
  -- Get quiz details
  SELECT * INTO quiz_record FROM quizzes WHERE id = quiz_id_param;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  RAISE NOTICE 'Processing quiz: % with % answers', quiz_record.title, jsonb_array_length(answers_data);

  -- Create quiz submission (simple insert)
  INSERT INTO quiz_submissions (
    quiz_id,
    student_id,
    attempt_number,
    submitted_at,
    status
  ) VALUES (
    quiz_id_param,
    student_id_param,
    1,
    NOW(),
    'submitted'
  ) RETURNING id INTO new_submission_id;

  RAISE NOTICE 'Created submission with ID: %', new_submission_id;

  -- Process each answer
  FOR answer_data IN SELECT * FROM jsonb_array_elements(answers_data)
  LOOP
    RAISE NOTICE 'Processing answer for question_id: %', (answer_data->>'question_id')::UUID;
    
    -- Get question details
    SELECT * INTO question_record FROM quiz_questions WHERE id = (answer_data->>'question_id')::UUID;
    
    IF FOUND THEN
      total_questions := total_questions + 1;
      RAISE NOTICE 'Found question: % (type: %)', question_record.question_text, question_record.question_type;
      
      -- Determine if the student's answer is correct and calculate points
      is_correct_answer := FALSE;
      answer_points := 0;
      selected_ans_id := (answer_data->>'selected_answer_id')::UUID;

      IF question_record.question_type = 'multiple_choice' OR question_record.question_type = 'true_false' THEN
        RAISE NOTICE 'Processing % question', question_record.question_type;
        RAISE NOTICE 'Selected Answer ID: %', selected_ans_id;

        -- For multiple choice and true/false, check selected_answer_id
        SELECT qa.is_correct, question_record.points INTO correct_ans_check, question_pts
        FROM quiz_answers qa
        WHERE qa.id = selected_ans_id AND qa.question_id = question_record.id;
        
        IF FOUND THEN
          RAISE NOTICE 'Found answer in quiz_answers. is_correct: %, points: %', correct_ans_check, question_pts;
          IF correct_ans_check THEN
            is_correct_answer := TRUE;
            answer_points := question_pts;
            RAISE NOTICE 'Answer is CORRECT! Points: %', answer_points;
          ELSE
            RAISE NOTICE 'Answer is INCORRECT';
          END IF;
        ELSE
          RAISE NOTICE 'Selected answer ID % not found in quiz_answers for question %', selected_ans_id, question_record.id;
          is_correct_answer := FALSE;
          answer_points := 0;
        END IF;

      ELSIF question_record.question_type = 'matching' THEN
        RAISE NOTICE 'Processing matching question';
        -- For matching, compare submitted pairs with correct pairs
        DECLARE
          correct_matching_pairs JSONB;
          submitted_matching_pairs JSONB := answer_data->'matching_pairs';
          all_correct BOOLEAN := TRUE;
          correct_pair_count INTEGER := 0;
          total_pair_count INTEGER := 0;
        BEGIN
          SELECT jsonb_agg(jsonb_build_object('left', left_item, 'right', right_item) ORDER BY order_index)
          INTO correct_matching_pairs
          FROM quiz_matching_pairs
          WHERE question_id = question_record.id;

          IF submitted_matching_pairs IS NOT NULL AND jsonb_array_length(submitted_matching_pairs) > 0 THEN
            total_pair_count := jsonb_array_length(submitted_matching_pairs);
            FOR i IN 0..total_pair_count - 1 LOOP
              DECLARE
                submitted_left TEXT := submitted_matching_pairs->i->>'left';
                submitted_right TEXT := submitted_matching_pairs->i->>'right';
              BEGIN
                IF NOT EXISTS (
                  SELECT 1 FROM quiz_matching_pairs
                  WHERE question_id = question_record.id
                    AND left_item = submitted_left
                    AND right_item = submitted_right
                ) THEN
                  all_correct := FALSE;
                  EXIT;
                ELSE
                  correct_pair_count := correct_pair_count + 1;
                END IF;
              END;
            END LOOP;
          ELSE
            all_correct := FALSE; -- No submitted pairs for a matching question
          END IF;

          IF all_correct AND total_pair_count > 0 THEN
            is_correct_answer := TRUE;
            answer_points := question_record.points;
          ELSE
            is_correct_answer := FALSE;
            answer_points := 0;
          END IF;
        END;
      END IF;

      RAISE NOTICE 'Final result: is_correct_answer: %, answer_points: %', is_correct_answer, answer_points;

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
        selected_ans_id,
        answer_data->'matching_pairs',
        is_correct_answer,
        answer_points
      );

      -- Add to total score
      calculated_score := calculated_score + COALESCE(answer_points, 0);
      calculated_points := calculated_points + COALESCE(question_record.points, 0);
      
      -- Count correct answers
      IF is_correct_answer THEN
        correct_answer_count := correct_answer_count + 1;
      END IF;
    ELSE
      RAISE NOTICE 'Question ID % not found in quiz_questions.', (answer_data->>'question_id')::UUID;
    END IF;
  END LOOP;

  -- Calculate percentage and pass status
  IF calculated_points > 0 THEN
    calculated_percentage := ROUND((calculated_score::DECIMAL / calculated_points::DECIMAL) * 100, 2);
  ELSE
    calculated_percentage := 0;
  END IF;
  
  passed := calculated_percentage >= COALESCE(quiz_record.passing_score, 60);

  RAISE NOTICE 'Final calculation: score=%/% (%), passed=%', calculated_score, calculated_points, calculated_percentage, passed;

  -- Update submission with results using correct column names
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
    'total_questions', total_questions
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION submit_quiz_complete(UUID, UUID, JSONB) TO authenticated;
