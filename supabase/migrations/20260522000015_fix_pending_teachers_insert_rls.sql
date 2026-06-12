-- Teacher signup: direct INSERT blocked by RLS for some roles/sessions.
-- Fix: reset policies + SECURITY DEFINER RPCs that bypass RLS safely.

GRANT INSERT ON public.pending_teachers TO anon, authenticated;
GRANT INSERT ON public.pending_teacher_documents TO anon, authenticated;

-- Reset pending_teachers policies to a known-good set
DROP POLICY IF EXISTS "Anyone can insert pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "pending_teachers_public_insert" ON public.pending_teachers;
DROP POLICY IF EXISTS "Users can view own pending teacher application" ON public.pending_teachers;
DROP POLICY IF EXISTS "pending_teachers_user_view_own" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can view all pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "pending_teachers_admin_select" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can update pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "pending_teachers_admin_update" ON public.pending_teachers;
DROP POLICY IF EXISTS "Admins can delete pending teachers" ON public.pending_teachers;
DROP POLICY IF EXISTS "pending_teachers_admin_delete" ON public.pending_teachers;

-- No TO clause: applies to anon, authenticated, and any client role
CREATE POLICY "pending_teachers_public_insert"
  ON public.pending_teachers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "pending_teachers_user_view_own"
  ON public.pending_teachers
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "pending_teachers_admin_select"
  ON public.pending_teachers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "pending_teachers_admin_update"
  ON public.pending_teachers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "pending_teachers_admin_delete"
  ON public.pending_teachers
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- RPC: insert application (bypasses RLS)
CREATE OR REPLACE FUNCTION public.submit_teacher_application(
  p_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_password text,
  p_bio text,
  p_experience text,
  p_category text,
  p_subjects text[],
  p_cv_file_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pending_teachers (
    id,
    name,
    email,
    phone,
    password,
    bio,
    experience,
    category,
    subjects,
    status,
    cv_file_path
  ) VALUES (
    p_id,
    trim(p_name),
    lower(trim(p_email)),
    trim(p_phone),
    p_password,
    nullif(trim(p_bio), ''),
    nullif(trim(p_experience), ''),
    p_category,
    p_subjects,
    'pending',
    p_cv_file_path
  );
  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_teacher_application(
  uuid, text, text, text, text, text, text, text, text[], text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_teacher_application(
  uuid, text, text, text, text, text, text, text, text[], text
) TO anon, authenticated;

-- RPC: insert document row (bypasses RLS)
CREATE OR REPLACE FUNCTION public.submit_teacher_document(
  p_pending_teacher_id uuid,
  p_doc_type text,
  p_file_path text,
  p_file_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.pending_teacher_documents (
    id,
    pending_teacher_id,
    doc_type,
    file_path,
    file_name
  ) VALUES (
    v_id,
    p_pending_teacher_id,
    p_doc_type,
    p_file_path,
    p_file_name
  );
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_teacher_document(
  uuid, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_teacher_document(
  uuid, text, text, text
) TO anon, authenticated;
