-- Update storage policies to allow teachers to upload quiz images

-- Drop only the policies that need to be updated (skip the public read policy)
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

-- Create new policies that include teachers
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'teacher'))
);

-- Policy to allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'teacher'))
);

-- Policy to allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin', 'teacher'))
);
