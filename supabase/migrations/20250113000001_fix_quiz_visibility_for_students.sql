-- Fix quiz visibility for students based on draft status and scheduled time
-- Date: 2025-01-13
-- This ensures:
-- 1. Draft quizzes are only visible to teachers
-- 2. Scheduled quizzes only appear to students after the scheduled time
-- 3. Teachers can always see all quizzes they created

-- Drop and recreate the get_classroom_feed function with proper quiz filtering
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
    -- For students: only show quizzes that are not drafts and either not scheduled or scheduled time has passed
    -- For teachers: show all quizzes
    CASE 
      WHEN q.id IS NULL THEN FALSE
      WHEN is_teacher AND cp.author_teacher_id = teacher_id_var THEN TRUE
      WHEN q.is_draft = TRUE THEN FALSE
      WHEN q.scheduled_open_at IS NOT NULL AND q.scheduled_open_at > NOW() THEN FALSE
      ELSE TRUE
    END as has_quiz,
    q.time_limit_minutes as quiz_time_limit,
    q.is_draft as quiz_is_draft,
    q.scheduled_open_at as quiz_scheduled_open_at,
    q.status as quiz_status
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  LEFT JOIN quizzes q ON cp.id = q.post_id
  WHERE cp.classroom_id = classroom_id_param
  ORDER BY cp.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_classroom_feed(UUID) IS 'Returns classroom feed with proper quiz visibility: teachers see all quizzes, students only see published quizzes that are not drafts and have passed their scheduled open time';

