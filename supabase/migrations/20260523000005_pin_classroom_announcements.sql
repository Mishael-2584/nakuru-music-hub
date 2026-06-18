-- Pin classroom announcements so teachers can keep important updates at the top
-- Date: 2026-05-23

ALTER TABLE public.classroom_posts
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_classroom_posts_pinned
  ON public.classroom_posts(classroom_id, is_pinned DESC, pinned_at DESC NULLS LAST);

-- Pin or unpin an announcement (non-assignment posts only)
CREATE OR REPLACE FUNCTION set_classroom_post_pinned(
  post_id_param UUID,
  is_pinned_param BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_record RECORD;
  is_classroom_teacher BOOLEAN;
BEGIN
  SELECT cp.id, cp.classroom_id, cp.is_assignment
  INTO post_record
  FROM public.classroom_posts cp
  WHERE cp.id = post_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;

  IF COALESCE(post_record.is_assignment, false) THEN
    RAISE EXCEPTION 'Only announcements can be pinned';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.post_id = post_record.id
  ) THEN
    RAISE EXCEPTION 'Quiz posts cannot be pinned';
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.classrooms c
    INNER JOIN public.teachers t ON c.teacher_id = t.id
    WHERE c.id = post_record.classroom_id
      AND t.user_id = auth.uid()
  ) INTO is_classroom_teacher;

  IF NOT is_classroom_teacher THEN
    RAISE EXCEPTION 'Only the classroom teacher can pin announcements';
  END IF;

  UPDATE public.classroom_posts
  SET
    is_pinned = is_pinned_param,
    pinned_at = CASE WHEN is_pinned_param THEN now() ELSE NULL END
  WHERE id = post_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION set_classroom_post_pinned(UUID, BOOLEAN) TO authenticated;

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
  quiz_status TEXT,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_teacher BOOLEAN;
  teacher_id_var UUID;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM classrooms c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE c.id = classroom_id_param
      AND t.user_id = auth.uid()
  ) INTO is_teacher;

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
    q.status as quiz_status,
    cp.is_pinned,
    cp.pinned_at
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  LEFT JOIN quizzes q ON cp.id = q.post_id
  WHERE cp.classroom_id = classroom_id_param
    AND (
      (is_teacher AND cp.author_teacher_id = teacher_id_var)
      OR
      (NOT is_teacher AND (
        q.id IS NULL
        OR q.is_draft = FALSE
        OR (q.is_draft = TRUE AND q.scheduled_open_at IS NOT NULL)
      ))
    )
  ORDER BY cp.is_pinned DESC, cp.pinned_at DESC NULLS LAST, cp.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_classroom_feed(UUID) TO authenticated;

DROP FUNCTION IF EXISTS get_classroom_feed_paged(UUID, INTEGER, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_classroom_feed_paged(
  classroom_id_param UUID,
  limit_param INTEGER DEFAULT 30,
  before_created_at TIMESTAMPTZ DEFAULT NULL
)
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
  quiz_status TEXT,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_teacher BOOLEAN;
  teacher_id_var UUID;
  cutoff TIMESTAMPTZ;
BEGIN
  cutoff := COALESCE(before_created_at, now() + interval '1 second');

  SELECT EXISTS(
    SELECT 1 FROM classrooms c
    INNER JOIN teachers t ON c.teacher_id = t.id
    WHERE c.id = classroom_id_param
      AND t.user_id = auth.uid()
  ) INTO is_teacher;

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
    q.status as quiz_status,
    cp.is_pinned,
    cp.pinned_at
  FROM classroom_posts cp
  LEFT JOIN teachers t ON cp.author_teacher_id = t.id
  LEFT JOIN quizzes q ON cp.id = q.post_id
  WHERE cp.classroom_id = classroom_id_param
    AND cp.created_at < cutoff
    AND (
      (is_teacher AND cp.author_teacher_id = teacher_id_var)
      OR
      (NOT is_teacher AND (
        q.id IS NULL
        OR q.is_draft = FALSE
        OR (q.is_draft = TRUE AND q.scheduled_open_at IS NOT NULL)
      ))
    )
  ORDER BY cp.is_pinned DESC, cp.pinned_at DESC NULLS LAST, cp.created_at DESC
  LIMIT GREATEST(limit_param, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION get_classroom_feed_paged(UUID, INTEGER, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION set_classroom_post_pinned(UUID, BOOLEAN) IS
  'Allows the classroom teacher to pin or unpin announcement posts (not assignments or quizzes).';
