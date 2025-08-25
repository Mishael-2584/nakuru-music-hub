-- Function to update a classroom post
CREATE OR REPLACE FUNCTION update_classroom_post(
  post_id_param UUID,
  new_content_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the post content
  UPDATE classroom_posts 
  SET content = new_content_param,
      updated_at = NOW()
  WHERE id = post_id_param;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Function to delete a classroom post
CREATE OR REPLACE FUNCTION delete_classroom_post(
  post_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the post
  DELETE FROM classroom_posts 
  WHERE id = post_id_param;
  
  -- Check if any rows were affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_classroom_post(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_classroom_post(UUID) TO authenticated;
