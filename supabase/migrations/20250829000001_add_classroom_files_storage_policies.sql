-- Migration to add storage policies for classroom-files bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload classroom files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to classroom files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update classroom files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete classroom files" ON storage.objects;

-- Policy to allow authenticated users to upload classroom files
CREATE POLICY "Allow authenticated users to upload classroom files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'classroom-files' AND 
  auth.role() = 'authenticated'
);

-- Policy to allow public read access to classroom files
CREATE POLICY "Allow public read access to classroom files" ON storage.objects
FOR SELECT USING (bucket_id = 'classroom-files');

-- Policy to allow authenticated users to update classroom files
CREATE POLICY "Allow authenticated users to update classroom files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'classroom-files' AND 
  auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete classroom files
CREATE POLICY "Allow authenticated users to delete classroom files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'classroom-files' AND 
  auth.role() = 'authenticated'
);
