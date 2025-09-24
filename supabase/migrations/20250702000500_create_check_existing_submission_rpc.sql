-- Create RPC function to efficiently check for existing quiz submissions
-- Date: 2025-07-02

CREATE OR REPLACE FUNCTION check_existing_quiz_submission(
  quiz_id_param UUID,
  student_id_param UUID
)
RETURNS TABLE (
  id UUID,
  quiz_id UUID,
  student_id UUID,
  attempt_number INTEGER,
  submitted_at TIMESTAMPTZ,
  status TEXT,
  total_score INTEGER,
  percentage_score DECIMAL,
  is_passed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qs.id,
    qs.quiz_id,
    qs.student_id,
    qs.attempt_number,
    qs.submitted_at,
    qs.status,
    qs.total_score,
    qs.percentage_score,
    qs.is_passed
  FROM quiz_submissions qs
  WHERE qs.quiz_id = quiz_id_param
    AND qs.student_id = student_id_param
  ORDER BY qs.submitted_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_existing_quiz_submission(UUID, UUID) TO authenticated;
