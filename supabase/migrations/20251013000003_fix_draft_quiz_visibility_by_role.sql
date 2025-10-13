-- Fix draft quiz visibility by checking user's actual role, not just teacher existence
-- Date: 2025-10-13
-- Issue: Same person can be both student and teacher, need to check which role they're using

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
  user_role TEXT;
  teacher_id_var UUID;
BEGIN
  -- Get the user's role from profiles table
  SELECT role INTO user_role
  FROM profiles
  WHERE user_id = auth.uid();

  -- Get the teacher_id if the user has teacher role
  IF user_role = 'teacher' THEN
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
      (user_role = 'teacher' AND cp.author_teacher_id = teacher_id_var)
      OR
      -- Students can only see:
      -- 1. Non-quiz posts
      -- 2. Published quizzes that are not drafts and are either not scheduled or scheduled time has passed
      (user_role = 'student' AND (
        q.id IS NULL  -- Non-quiz posts
        OR
        (q.is_draft = FALSE AND (q.scheduled_open_at IS NULL OR q.scheduled_open_at <= NOW()))  -- Published, available quizzes
      ))
      OR
      -- Admins can see all posts
      (user_role = 'admin')
    )
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_classroom_feed(UUID) IS 'Returns classroom feed with proper visibility based on user role: teachers see all their posts including drafts, students only see non-draft quizzes that have passed their scheduled open time, admins see all';

