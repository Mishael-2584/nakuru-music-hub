-- Ensure teacher-cvs bucket exists and allows anonymous uploads for teacher signup form
-- Teacher signup is unauthenticated; uploads must be allowed for anon role.

-- Ensure bucket exists with reasonable limits for CVs and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-cvs',
  'teacher-cvs',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = COALESCE(storage.buckets.file_size_limit, 10485760),
  allowed_mime_types = COALESCE(storage.buckets.allowed_mime_types, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Drop the generic "Public access" policy if it exists (may block anon in some setups)
DROP POLICY IF EXISTS "Public access to teacher-cvs" ON storage.objects;

-- Allow anyone (including anon) to INSERT into teacher-cvs for signup form
CREATE POLICY "Allow insert into teacher-cvs for signup"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'teacher-cvs');

-- Allow authenticated admins to do everything on teacher-cvs
DROP POLICY IF EXISTS "Admins manage teacher-cvs" ON storage.objects;
CREATE POLICY "Admins manage teacher-cvs" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    bucket_id = 'teacher-cvs'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Allow SELECT for admins and for service role (for reading uploaded files)
DROP POLICY IF EXISTS "Admins can view teacher CVs" ON storage.objects;
CREATE POLICY "Admins can view teacher CVs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'teacher-cvs'
    AND (
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
      OR auth.role() = 'service_role'
    )
  );
