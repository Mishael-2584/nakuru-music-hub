-- Answers fetcher for students (RLS-safe via security definer)
-- Date: 2025-10-14

DROP FUNCTION IF EXISTS public.get_answers_for_questions(UUID[]);

CREATE OR REPLACE FUNCTION public.get_answers_for_questions(question_ids_param UUID[])
RETURNS TABLE (
  id UUID,
  question_id UUID,
  answer_text TEXT,
  is_correct BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT qa.id, qa.question_id, qa.answer_text, qa.is_correct
  FROM public.quiz_answers qa
  WHERE qa.question_id = ANY(question_ids_param);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_answers_for_questions(UUID[]) TO authenticated;

-- Diagnostic function to help troubleshoot student login issues
CREATE OR REPLACE FUNCTION public.diagnose_student_access()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  has_student_record BOOLEAN,
  has_teacher_record BOOLEAN,
  user_role TEXT,
  can_access_students BOOLEAN,
  can_access_teachers BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_role TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  current_user_email := (SELECT email FROM auth.users WHERE id = current_user_id);

  -- Check if user has student record
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = current_user_id;

  RETURN QUERY
  SELECT
    current_user_id,
    current_user_email,
    EXISTS(SELECT 1 FROM public.students WHERE user_id = current_user_id) AS has_student_record,
    EXISTS(SELECT 1 FROM public.teachers WHERE user_id = current_user_id) AS has_teacher_record,
    current_user_role,
    -- Test if user can access students table
    (SELECT count(*) > 0 FROM public.students WHERE user_id = current_user_id LIMIT 1) AS can_access_students,
    -- Test if user can access teachers table
    (SELECT count(*) > 0 FROM public.teachers WHERE user_id = current_user_id LIMIT 1) AS can_access_teachers;
END;
$$;

GRANT EXECUTE ON FUNCTION public.diagnose_student_access() TO authenticated;


