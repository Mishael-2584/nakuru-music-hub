-- Teacher signup fails for anon with: permission denied for table users (42501)
-- Cause: storage.objects SELECT/UPDATE policies query auth.users without TO authenticated.
-- Postgres still needs SELECT on auth.users to evaluate those policies, even when auth.uid() is null.

-- ── storage.objects: remove teacher-cvs policies that touch auth.users ──────────
DROP POLICY IF EXISTS "Anyone can upload teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Public access to teacher-cvs" ON storage.objects;

-- Anon + authenticated signup uploads (unique filenames; no auth.users subqueries)
DROP POLICY IF EXISTS "Allow insert into teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow insert into teacher-cvs for signup"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'teacher-cvs');

DROP POLICY IF EXISTS "Allow anon select teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow anon select teacher-cvs for signup"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'teacher-cvs');

DROP POLICY IF EXISTS "Allow anon update teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow anon update teacher-cvs for signup"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'teacher-cvs')
  WITH CHECK (bucket_id = 'teacher-cvs');

-- Teachers (authenticated) may upload their own docs
DROP POLICY IF EXISTS "Teachers upload own documents to teacher-cvs" ON storage.objects;
CREATE POLICY "Teachers upload own documents to teacher-cvs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (SELECT user_id FROM public.teachers WHERE user_id IS NOT NULL)
  );

-- Admins (authenticated) full access via profiles — never evaluated for anon
DROP POLICY IF EXISTS "Admins manage teacher-cvs" ON storage.objects;
CREATE POLICY "Admins manage teacher-cvs"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- ── pending_teachers: stop anon from hitting auth.users on SELECT policies ─────
DROP POLICY IF EXISTS "Users can view own pending teacher application" ON public.pending_teachers;
CREATE POLICY "Users can view own pending teacher application"
  ON public.pending_teachers
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can insert pending teachers" ON public.pending_teachers;
CREATE POLICY "Anyone can insert pending teachers"
  ON public.pending_teachers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── pending_teacher_documents: signup insert + admin manage (profiles only) ──
DROP POLICY IF EXISTS "Allow insert into pending_teacher_documents for signup" ON public.pending_teacher_documents;
CREATE POLICY "Allow insert into pending_teacher_documents for signup"
  ON public.pending_teacher_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage pending teacher documents" ON public.pending_teacher_documents;
CREATE POLICY "Admins manage pending teacher documents"
  ON public.pending_teacher_documents
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );
