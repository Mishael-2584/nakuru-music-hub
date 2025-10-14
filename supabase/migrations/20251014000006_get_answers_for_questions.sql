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


