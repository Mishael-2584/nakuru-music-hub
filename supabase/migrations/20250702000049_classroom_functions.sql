-- Migration: Classroom RPC functions (create, approve, join, posts, comments, feeds)
-- Date: 2025-07-02

-- Helper to generate class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS(
      SELECT 1 FROM public.classrooms WHERE class_code = code
    );
  END LOOP;
  RETURN code;
END; $$ LANGUAGE plpgsql;

-- Create classroom (teacher)
CREATE OR REPLACE FUNCTION create_classroom(
  teacher_id_param UUID,
  name_param TEXT,
  description_param TEXT
)
RETURNS TABLE (id UUID, status TEXT) AS $$
BEGIN
  INSERT INTO public.classrooms(teacher_id, name, description, status)
  VALUES (teacher_id_param, name_param, description_param, 'pending')
  RETURNING classrooms.id, classrooms.status INTO id, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Approve classroom (admin)
CREATE OR REPLACE FUNCTION approve_classroom(
  classroom_id_param UUID,
  approved_by_param UUID
)
RETURNS TABLE (id UUID, class_code TEXT, status TEXT) AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_class_code();
  UPDATE public.classrooms
  SET status = 'approved',
      class_code = new_code,
      approved_at = now(),
      approved_by = approved_by_param
  WHERE id = classroom_id_param
  RETURNING classrooms.id, classrooms.class_code, classrooms.status INTO id, class_code, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Enroll via class code (student)
CREATE OR REPLACE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (classroom_id UUID, status TEXT) AS $$
DECLARE
  c_id UUID;
BEGIN
  SELECT id INTO c_id FROM public.classrooms WHERE class_code = class_code_param AND status = 'approved';
  IF c_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive class code';
  END IF;

  INSERT INTO public.classroom_enrollments(classroom_id, student_id, status)
  VALUES (c_id, student_id_param, 'enrolled')
  ON CONFLICT (classroom_id, student_id) DO UPDATE SET status = 'enrolled', joined_at = now()
  RETURNING classroom_enrollments.classroom_id, classroom_enrollments.status INTO classroom_id, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Teacher creates post
CREATE OR REPLACE FUNCTION create_classroom_post(
  classroom_id_param UUID,
  author_teacher_id_param UUID,
  content_param TEXT
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  INSERT INTO public.classroom_posts(classroom_id, author_teacher_id, content)
  VALUES (classroom_id_param, author_teacher_id_param, content_param)
  RETURNING classroom_posts.id INTO id;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Add comment (student or teacher)
CREATE OR REPLACE FUNCTION add_classroom_comment(
  post_id_param UUID,
  author_student_id_param UUID,
  author_teacher_id_param UUID,
  content_param TEXT
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  INSERT INTO public.classroom_comments(post_id, author_student_id, author_teacher_id, content)
  VALUES (post_id_param, author_student_id_param, author_teacher_id_param, content_param)
  RETURNING classroom_comments.id INTO id;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Get classroom feed (posts with author and comment counts)
CREATE OR REPLACE FUNCTION get_classroom_feed(classroom_id_param UUID)
RETURNS TABLE (
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.created_at,
    COALESCE(t.name, 'Teacher') as author_name,
    (SELECT COUNT(*) FROM public.classroom_comments c WHERE c.post_id = p.id)::INTEGER as comments_count
  FROM public.classroom_posts p
  LEFT JOIN public.teachers t ON t.id = p.author_teacher_id
  WHERE p.classroom_id = classroom_id_param
  ORDER BY p.created_at DESC;
END; $$ LANGUAGE plpgsql;

-- Get post comments
CREATE OR REPLACE FUNCTION get_post_comments(post_id_param UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.created_at,
    COALESCE(s.student_name, t.name, 'User') AS author_name,
    CASE WHEN c.author_student_id IS NOT NULL THEN 'student' ELSE 'teacher' END AS author_role
  FROM public.classroom_comments c
  LEFT JOIN public.students s ON s.id = c.author_student_id
  LEFT JOIN public.teachers t ON t.id = c.author_teacher_id
  WHERE c.post_id = post_id_param
  ORDER BY c.created_at ASC;
END; $$ LANGUAGE plpgsql;


-- Date: 2025-07-02

-- Helper to generate class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  LOOP
    code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS(
      SELECT 1 FROM public.classrooms WHERE class_code = code
    );
  END LOOP;
  RETURN code;
END; $$ LANGUAGE plpgsql;

-- Create classroom (teacher)
CREATE OR REPLACE FUNCTION create_classroom(
  teacher_id_param UUID,
  name_param TEXT,
  description_param TEXT
)
RETURNS TABLE (id UUID, status TEXT) AS $$
BEGIN
  INSERT INTO public.classrooms(teacher_id, name, description, status)
  VALUES (teacher_id_param, name_param, description_param, 'pending')
  RETURNING classrooms.id, classrooms.status INTO id, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Approve classroom (admin)
CREATE OR REPLACE FUNCTION approve_classroom(
  classroom_id_param UUID,
  approved_by_param UUID
)
RETURNS TABLE (id UUID, class_code TEXT, status TEXT) AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := generate_class_code();
  UPDATE public.classrooms
  SET status = 'approved',
      class_code = new_code,
      approved_at = now(),
      approved_by = approved_by_param
  WHERE id = classroom_id_param
  RETURNING classrooms.id, classrooms.class_code, classrooms.status INTO id, class_code, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Enroll via class code (student)
CREATE OR REPLACE FUNCTION enroll_student_with_code(
  student_id_param UUID,
  class_code_param TEXT
)
RETURNS TABLE (classroom_id UUID, status TEXT) AS $$
DECLARE
  c_id UUID;
BEGIN
  SELECT id INTO c_id FROM public.classrooms WHERE class_code = class_code_param AND status = 'approved';
  IF c_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive class code';
  END IF;

  INSERT INTO public.classroom_enrollments(classroom_id, student_id, status)
  VALUES (c_id, student_id_param, 'enrolled')
  ON CONFLICT (classroom_id, student_id) DO UPDATE SET status = 'enrolled', joined_at = now()
  RETURNING classroom_enrollments.classroom_id, classroom_enrollments.status INTO classroom_id, status;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Teacher creates post
CREATE OR REPLACE FUNCTION create_classroom_post(
  classroom_id_param UUID,
  author_teacher_id_param UUID,
  content_param TEXT
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  INSERT INTO public.classroom_posts(classroom_id, author_teacher_id, content)
  VALUES (classroom_id_param, author_teacher_id_param, content_param)
  RETURNING classroom_posts.id INTO id;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Add comment (student or teacher)
CREATE OR REPLACE FUNCTION add_classroom_comment(
  post_id_param UUID,
  author_student_id_param UUID,
  author_teacher_id_param UUID,
  content_param TEXT
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  INSERT INTO public.classroom_comments(post_id, author_student_id, author_teacher_id, content)
  VALUES (post_id_param, author_student_id_param, author_teacher_id_param, content_param)
  RETURNING classroom_comments.id INTO id;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql;

-- Get classroom feed (posts with author and comment counts)
CREATE OR REPLACE FUNCTION get_classroom_feed(classroom_id_param UUID)
RETURNS TABLE (
  post_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.created_at,
    COALESCE(t.name, 'Teacher') as author_name,
    (SELECT COUNT(*) FROM public.classroom_comments c WHERE c.post_id = p.id)::INTEGER as comments_count
  FROM public.classroom_posts p
  LEFT JOIN public.teachers t ON t.id = p.author_teacher_id
  WHERE p.classroom_id = classroom_id_param
  ORDER BY p.created_at DESC;
END; $$ LANGUAGE plpgsql;

-- Get post comments
CREATE OR REPLACE FUNCTION get_post_comments(post_id_param UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.created_at,
    COALESCE(s.student_name, t.name, 'User') AS author_name,
    CASE WHEN c.author_student_id IS NOT NULL THEN 'student' ELSE 'teacher' END AS author_role
  FROM public.classroom_comments c
  LEFT JOIN public.students s ON s.id = c.author_student_id
  LEFT JOIN public.teachers t ON t.id = c.author_teacher_id
  WHERE c.post_id = post_id_param
  ORDER BY c.created_at ASC;
END; $$ LANGUAGE plpgsql;

