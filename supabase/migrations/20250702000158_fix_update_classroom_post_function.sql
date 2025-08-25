-- Fix the update_classroom_post function to only update content
CREATE OR REPLACE FUNCTION update_classroom_post(
  post_id_param UUID,
  new_content_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update only the post content (removed updated_at since column doesn't exist)
  UPDATE classroom_posts 
  SET content = new_content_param
  WHERE id = post_id_param;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_classroom_post(UUID, TEXT) TO authenticated;
