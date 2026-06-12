-- Harden teacher signup RPCs: postgres owner + row_security off

ALTER FUNCTION public.submit_teacher_application(
  uuid, text, text, text, text, text, text, text, text[], text
) OWNER TO postgres;

ALTER FUNCTION public.submit_teacher_document(
  uuid, text, text, text
) OWNER TO postgres;

-- Ensure open INSERT policy exists (idempotent)
DROP POLICY IF EXISTS "pending_teachers_public_insert" ON public.pending_teachers;
CREATE POLICY "pending_teachers_public_insert"
  ON public.pending_teachers
  FOR INSERT
  WITH CHECK (true);

GRANT INSERT ON public.pending_teachers TO anon, authenticated;
GRANT INSERT ON public.pending_teacher_documents TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_teacher_application(
  uuid, text, text, text, text, text, text, text, text[], text
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_teacher_document(
  uuid, text, text, text
) TO anon, authenticated;
