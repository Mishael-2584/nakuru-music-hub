-- Fix teacher-cvs storage for anon: explicit TO anon and allow SELECT/UPDATE for upsert
-- Required when upload uses upsert: true; anon role must be explicitly allowed (TO anon).

DROP POLICY IF EXISTS "Allow insert into teacher-cvs for signup" ON storage.objects;
CREATE POLICY "Allow insert into teacher-cvs for signup"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'teacher-cvs');

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
