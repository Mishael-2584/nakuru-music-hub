-- Migration: Add public access and all functions to lesson materials bucket policy
-- This migration ensures the lesson-materials bucket has proper access policies

-- First, ensure the lesson-materials bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-materials', 'lesson-materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public access to lesson-materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can manage lesson materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can view lesson materials" ON storage.objects;

-- Create a single, broad policy for all operations on lesson-materials bucket
CREATE POLICY "Public access to lesson-materials" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'lesson-materials') 
  WITH CHECK (bucket_id = 'lesson-materials');

-- Also ensure general-uploads bucket has public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('general-uploads', 'general-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policy for general-uploads bucket
DROP POLICY IF EXISTS "Public access to general-uploads" ON storage.objects;

CREATE POLICY "Public access to general-uploads" ON storage.objects
  FOR ALL 
  USING (bucket_id = 'general-uploads') 
  WITH CHECK (bucket_id = 'general-uploads');