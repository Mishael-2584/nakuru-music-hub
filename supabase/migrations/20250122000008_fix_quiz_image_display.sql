-- Fix quiz image display by updating the get_quiz_by_post_id function
-- This ensures teacher-uploaded images appear in quizzes

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_quiz_by_post_id(UUID);

-- Create the updated function with image fields
CREATE OR REPLACE FUNCTION get_quiz_by_post_id(post_id_param UUID)
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
  has_image_attachment BOOLEAN,
  image_url TEXT,
  image_filename TEXT,
  answer_id UUID,
  answer_text TEXT,
  answer_is_correct BOOLEAN,
  answer_order INTEGER,
  matching_left TEXT,
  matching_right TEXT,
  matching_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    qq.has_image_attachment,
    qq.image_url,
    qq.image_filename,
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
  WHERE q.post_id = post_id_param
  ORDER BY qq.order_index, qa.order_index, qmp.order_index;
END;
$$;

COMMENT ON FUNCTION get_quiz_by_post_id(UUID) IS 'Updated to include image fields for quiz questions';
