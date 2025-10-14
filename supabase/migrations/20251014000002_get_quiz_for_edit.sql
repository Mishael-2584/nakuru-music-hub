-- Single-call RPC to fetch quiz + questions + answers + matching pairs for edit
-- Date: 2025-10-14

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_post_id ON public.quizzes(post_id);

DROP FUNCTION IF EXISTS public.get_quiz_for_edit(UUID);

CREATE OR REPLACE FUNCTION public.get_quiz_for_edit(post_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q RECORD;
  questions JSONB := '[]'::jsonb;
  answers JSONB := '[]'::jsonb;
  pairs JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO q FROM public.quizzes WHERE post_id = post_id_param;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(qq.* ORDER BY qq.order_index), '[]'::jsonb)
  INTO questions
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = q.id;

  SELECT COALESCE(jsonb_agg(qa.*), '[]'::jsonb)
  INTO answers
  FROM public.quiz_answers qa
  WHERE qa.question_id IN (
    SELECT id FROM public.quiz_questions WHERE quiz_id = q.id
  );

  SELECT COALESCE(jsonb_agg(qmp.*), '[]'::jsonb)
  INTO pairs
  FROM public.quiz_matching_pairs qmp
  WHERE qmp.question_id IN (
    SELECT id FROM public.quiz_questions WHERE quiz_id = q.id
  );

  RETURN jsonb_build_object(
    'quiz', to_jsonb(q),
    'questions', questions,
    'answers', answers,
    'matching_pairs', pairs
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_for_edit(UUID) TO authenticated;


