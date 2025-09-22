-- Update get_classroom_feed function to include quiz information
-- Date: 2025-07-02

-- Update the get_classroom_feed function to include quiz information
DROP FUNCTION IF EXISTS get_classroom_feed(UUID);

CREATE OR REPLACE FUNCTION get_classroom_feed(classroom_id_param UUID)
RETURNS TABLE (
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_teacher_id UUID,
  is_assignment BOOLEAN,
  assignment_title TEXT,
  due_date TIMESTAMPTZ,
  max_points INTEGER,
  is_timed BOOLEAN,
  time_limit_minutes INTEGER,
  has_quiz BOOLEAN,
  quiz_time_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id as post_id,
    cp.content,
    cp.created_at,
    COALESCE(t.name, 'Unknown') as author_name,
    cp.author_teacher_id,
    cp.is_assignment,
    cp.assignment_title,
    cp.due_date,
    cp.max_points,
    cp.is_timed,
    cp.time_limit_minutes,
    CASE WHEN q.id IS NOT NULL THEN TRUE ELSE FALSE END as has_quiz,
    q.time_limit_minutes as quiz_time_limit
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  LEFT JOIN quizzes q ON cp.id = q.post_id
  WHERE cp.classroom_id = classroom_id_param
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;
