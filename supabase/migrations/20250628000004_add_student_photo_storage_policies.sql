-- Migration to add storage policies for student profile photos

-- Policy to allow authenticated students to upload their profile photos
CREATE POLICY "Allow students to upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'student-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'student')
);

-- Policy to allow public read access to student profile photos
CREATE POLICY "Allow public read access to student profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'student-photos'
);

-- Policy to allow students to update their profile photos
CREATE POLICY "Allow students to update profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'student-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'student')
);

-- Policy to allow students to delete their profile photos
CREATE POLICY "Allow students to delete profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'student-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'student')
);

-- Also allow admins to manage student profile photos
CREATE POLICY "Allow admins to manage student profile photos" ON storage.objects
FOR ALL USING (
  bucket_id = 'images' AND 
  (storage.foldername(name))[1] = 'student-photos' AND
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
); 