-- Create documents bucket for storing PDFs and other documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents', 
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for documents bucket
CREATE POLICY "Allow public read access to documents" ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Allow anonymous users to upload (for guest checkout)
CREATE POLICY "Allow anonymous users to upload documents" ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'documents');
