-- Create RPC function to get submission answers efficiently
-- Date: 2025-07-02

CREATE OR REPLACE FUNCTION get_quiz_submission_answers(submission_id_param UUID)
RETURNS TABLE (
  id UUID,
  submission_id UUID,
  question_id UUID,
  selected_answer_id UUID,
  matching_pairs JSONB,
  is_correct BOOLEAN,
  points_earned INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qsa.id,
    qsa.submission_id,
    qsa.question_id,
    qsa.selected_answer_id,
    qsa.matching_pairs,
    qsa.is_correct,
    qsa.points_earned,
    qsa.created_at
  FROM quiz_submission_answers qsa
  WHERE qsa.submission_id = submission_id_param
  ORDER BY qsa.created_at ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_quiz_submission_answers(UUID) TO authenticated;
