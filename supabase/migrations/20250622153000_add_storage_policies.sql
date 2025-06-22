-- Migration to add storage policies and update tables for image uploads

-- Update events table to support image uploads
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Update news table to support image uploads  
ALTER TABLE public.news 
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Create storage policies for the 'images' bucket
-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Policy to allow public read access to images
CREATE POLICY "Allow public read access to images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy to allow authenticated users to update their uploaded images
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Policy to allow authenticated users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' AND 
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Create function to generate unique image filenames
CREATE OR REPLACE FUNCTION generate_image_filename(original_filename TEXT, prefix TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
  file_extension TEXT;
  unique_filename TEXT;
BEGIN
  -- Extract file extension
  file_extension := CASE 
    WHEN original_filename LIKE '%.jpg' OR original_filename LIKE '%.jpeg' THEN '.jpg'
    WHEN original_filename LIKE '%.png' THEN '.png'
    WHEN original_filename LIKE '%.gif' THEN '.gif'
    WHEN original_filename LIKE '%.webp' THEN '.webp'
    ELSE '.jpg'
  END;
  
  -- Generate unique filename with timestamp and random string
  unique_filename := prefix || '_' || 
                    EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                    substr(md5(random()::text), 1, 8) || 
                    file_extension;
  
  RETURN unique_filename;
END;
$$ LANGUAGE plpgsql; 