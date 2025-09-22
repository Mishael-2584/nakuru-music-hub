-- Add timed assignment fields to classroom_posts table
-- Date: 2025-07-02

-- Add timed assignment fields
ALTER TABLE classroom_posts 
ADD COLUMN IF NOT EXISTS is_timed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

-- Add constraint to ensure time_limit_minutes is only set when is_timed is true
ALTER TABLE classroom_posts 
ADD CONSTRAINT check_timed_assignment 
CHECK (
  (is_timed = FALSE AND time_limit_minutes IS NULL) OR 
  (is_timed = TRUE AND time_limit_minutes IS NOT NULL AND time_limit_minutes > 0)
);

-- Update the get_classroom_feed function to include timed assignment fields
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
  time_limit_minutes INTEGER
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
    cp.time_limit_minutes
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  WHERE cp.classroom_id = classroom_id_param
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;
