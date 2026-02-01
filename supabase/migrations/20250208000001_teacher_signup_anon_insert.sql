-- Fix teacher signup RLS: allow anonymous insert into pending_teacher_documents and teacher-cvs storage
-- Teacher signup runs unauthenticated; document uploads and pending_teacher_documents inserts must be allowed for anon.
-- Storage upload uses upsert: true, so anon needs INSERT, SELECT, and UPDATE on teacher-cvs (per Supabase docs).

-- 1. Allow anyone (including anon) to INSERT into pending_teacher_documents during signup
DROP POLICY IF EXISTS "Allow insert into pending_teacher_documents for signup" ON public.pending_teacher_documents;
CREATE POLICY "Allow insert into pending_teacher_documents for signup"
  ON public.pending_teacher_documents
  FOR INSERT
  WITH CHECK (true);

-- 2. teacher-cvs bucket: allow anon INSERT (explicit TO anon; required for unauthenticated signup)
DROP POLICY IF EXISTS "Allow insert into teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow insert into teacher-cvs for signup"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'teacher-cvs');

-- 3. teacher-cvs: allow anon SELECT and UPDATE so upsert (upload with upsert: true) can complete
DROP POLICY IF EXISTS "Allow anon select teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow anon select teacher-cvs for signup"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'teacher-cvs');

DROP POLICY IF EXISTS "Allow anon update teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow anon update teacher-cvs for signup"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'teacher-cvs')
  WITH CHECK (bucket_id = 'teacher-cvs');
