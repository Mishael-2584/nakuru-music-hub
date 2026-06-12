-- Reconcile teacher signup: simple anon INSERT policies, no RPC/edge function required.
-- Frontend uses client-generated UUID and insert without .select('id').

-- Remove workaround RPCs added during debugging
DROP FUNCTION IF EXISTS public.submit_teacher_document(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.submit_teacher_application(
  uuid, text, text, text, text, text, text, text, text[], text
);

-- Remove temporary SELECT policy (only needed for old .select('id') client)
DROP POLICY IF EXISTS "pending_teachers_signup_select_returning" ON public.pending_teachers;

-- pending_teachers: public insert, admin manage, no auth.users
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

CREATE POLICY "pending_teachers_public_insert"
  ON public.pending_teachers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "pending_teachers_admin_select"
  ON public.pending_teachers FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "pending_teachers_admin_update"
  ON public.pending_teachers FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "pending_teachers_admin_delete"
  ON public.pending_teachers FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

GRANT INSERT ON public.pending_teachers TO anon, authenticated;

-- pending_teacher_documents
DROP POLICY IF EXISTS "Allow insert into pending_teacher_documents for signup" ON public.pending_teacher_documents;
DROP POLICY IF EXISTS "Admins manage pending teacher documents" ON public.pending_teacher_documents;

CREATE POLICY "pending_teacher_documents_public_insert"
  ON public.pending_teacher_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "pending_teacher_documents_admin_all"
  ON public.pending_teacher_documents FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')))
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

GRANT INSERT ON public.pending_teacher_documents TO anon, authenticated;

-- teacher-cvs storage: remove policies that query auth.users (break anon signup)
DROP POLICY IF EXISTS "Anyone can upload teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Public access to teacher-cvs" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert into teacher-cvs for signup" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon select teacher-cvs for signup" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update teacher-cvs for signup" ON storage.objects;
DROP POLICY IF EXISTS "Teachers upload own documents to teacher-cvs" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage teacher-cvs" ON storage.objects;

CREATE POLICY "teacher_cvs_signup_upload"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'teacher-cvs');

CREATE POLICY "teacher_cvs_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );
