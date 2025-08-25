-- Drop the existing function first
DROP FUNCTION IF EXISTS get_classroom_feed(UUID);

-- Create the updated get_classroom_feed function with teacher information
CREATE OR REPLACE FUNCTION get_classroom_feed(classroom_id_param UUID)
RETURNS TABLE (
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_teacher_id UUID
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
    cp.author_teacher_id
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  WHERE cp.classroom_id = classroom_id_param
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;
