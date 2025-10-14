-- Ensure get_classroom_feed function is using the correct implementation
-- Date: 2025-10-14
-- This migration ensures the function doesn't rely on profiles.role to determine
-- whether the current user is the teacher of THIS classroom. The profiles table
-- stores all users (admin, teacher, student), but classroom ownership must be
-- verified via the teachers/classrooms relationship.

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
  quiz_time_limit INTEGER,
  quiz_is_draft BOOLEAN,
  quiz_scheduled_open_at TIMESTAMPTZ,
  quiz_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_teacher BOOLEAN;
  teacher_id_var UUID;
BEGIN
  -- Check if the current user is a teacher of this classroom
  SELECT EXISTS(
    SELECT 1 FROM classrooms c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE c.id = classroom_id_param 
    AND t.user_id = auth.uid()
  ) INTO is_teacher;

  -- Get the teacher_id if the user is a teacher
  IF is_teacher THEN
    SELECT t.id INTO teacher_id_var
    FROM teachers t
    WHERE t.user_id = auth.uid();
  END IF;

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
    q.time_limit_minutes as quiz_time_limit,
    q.is_draft as quiz_is_draft,
    q.scheduled_open_at as quiz_scheduled_open_at,
    q.status as quiz_status
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  LEFT JOIN quizzes q ON cp.id = q.post_id
  WHERE cp.classroom_id = classroom_id_param
    AND (
      -- Teachers can see all their own posts (including drafts)
      (is_teacher AND cp.author_teacher_id = teacher_id_var)
      OR
      -- Students can see:
      -- 1. Non-quiz posts
      -- 2. Published quizzes (regardless of scheduled time - UI will handle access restrictions)
      -- 3. Draft quizzes WITH scheduled time (UI will show as restricted)
      -- 4. NOT draft quizzes WITHOUT scheduled time (completely hidden)
      (NOT is_teacher AND (
        q.id IS NULL  -- Non-quiz posts
        OR
        q.is_draft = FALSE  -- Published quizzes (all visible, UI handles access)
        OR
        (q.is_draft = TRUE AND q.scheduled_open_at IS NOT NULL)  -- Draft with scheduled time (show as restricted)
      ))
    )
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_classroom_feed(UUID) IS 'Returns classroom feed with correct visibility logic. Uses teachers table to check teacher status, NOT profiles.role (which is only for admins). Teachers see all posts, students see published quizzes and draft quizzes with scheduled times (shown as restricted), but NOT draft quizzes without scheduled times';

