-- Storage bucket for student lesson invoice PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read (students/admins open PDF links)
DROP POLICY IF EXISTS "Allow public read access to invoice PDFs" ON storage.objects;
CREATE POLICY "Allow public read access to invoice PDFs" ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');

-- Authenticated users can upload/update invoice PDFs
DROP POLICY IF EXISTS "Allow authenticated upload to invoices" ON storage.objects;
CREATE POLICY "Allow authenticated upload to invoices" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Allow authenticated update invoices" ON storage.objects;
CREATE POLICY "Allow authenticated update invoices" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

DROP POLICY IF EXISTS "Allow authenticated delete invoices" ON storage.objects;
CREATE POLICY "Allow authenticated delete invoices" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');
