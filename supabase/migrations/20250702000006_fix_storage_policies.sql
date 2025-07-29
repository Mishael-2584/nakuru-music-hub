-- Fix storage policies for teacher-cvs bucket
-- This migration adds proper storage policies to allow CV file uploads during teacher registration

-- Create the teacher-cvs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-cvs', 'teacher-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can upload teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage teacher CVs" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view own CVs" ON storage.objects;

-- Create policy to allow anyone to upload CV files to teacher-cvs bucket
-- This is needed for the public teacher registration form
CREATE POLICY "Anyone can upload teacher CVs" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'teacher-cvs' 
    AND (storage.foldername(name))[1] = 'teacher-cvs'
  );

-- Create policy to allow admins to view all CV files
CREATE POLICY "Admins can view teacher CVs" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'teacher-cvs' 
    AND (
      auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
      )
    )
  );

-- Create policy to allow admins to update CV files
CREATE POLICY "Admins can update teacher CVs" 
  ON storage.objects 
  FOR UPDATE 
  USING (
    bucket_id = 'teacher-cvs' 
    AND (
      auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
      )
    )
  );

-- Create policy to allow admins to delete CV files
CREATE POLICY "Admins can delete teacher CVs" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'teacher-cvs' 
    AND (
      auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
      )
    )
  );

-- Create policy to allow teachers to view their own CV files
CREATE POLICY "Teachers can view own CVs" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'teacher-cvs' 
    AND (
      name LIKE '%' || (
        SELECT email FROM auth.users WHERE id = auth.uid()
      ) || '%'
    )
  );

-- Also add policies for other storage buckets that might be needed
-- Create policies for general file uploads bucket if it exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('general-uploads', 'general-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow anyone to upload general files
CREATE POLICY "Anyone can upload general files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'general-uploads');

-- Create policy to allow authenticated users to view general files
CREATE POLICY "Authenticated users can view general files" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'general-uploads' 
    AND auth.role() = 'authenticated'
  );