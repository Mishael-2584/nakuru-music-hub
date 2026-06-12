-- Ensure anonymous teacher signup can insert applications and upload documents

-- pending_teachers: public application form (no SELECT required after insert)
DROP POLICY IF EXISTS "Anyone can insert pending teachers" ON public.pending_teachers;
CREATE POLICY "Anyone can insert pending teachers"
  ON public.pending_teachers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- pending_teacher_documents: linked uploads during signup
DROP POLICY IF EXISTS "Allow insert into pending_teacher_documents for signup" ON public.pending_teacher_documents;
CREATE POLICY "Allow insert into pending_teacher_documents for signup"
  ON public.pending_teacher_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- teacher-cvs storage: anon uploads + upsert during signup
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
