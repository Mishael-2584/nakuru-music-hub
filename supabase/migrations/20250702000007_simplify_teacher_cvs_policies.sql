-- Simplify storage policies for teacher-cvs bucket
-- Remove complex policies and add one simple public policy for all operations

-- Drop all the complex policies we created earlier
DROP POLICY IF EXISTS "Anyone can upload teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own CVs" ON storage.objects;

-- Create one simple public policy for all operations on teacher-cvs bucket
CREATE POLICY "Public access to teacher-cvs" 
  ON storage.objects 
  FOR ALL 
  USING (bucket_id = 'teacher-cvs')
  WITH CHECK (bucket_id = 'teacher-cvs');