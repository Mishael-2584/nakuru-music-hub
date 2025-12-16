-- Migration: Add backing tracks/audio file support to shop products
-- Date: 2025-02-05

-- Add audio file fields to shop_products table
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
ADD COLUMN IF NOT EXISTS audio_filename TEXT,
ADD COLUMN IF NOT EXISTS is_digital_product BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN shop_products.audio_file_url IS 'URL to the audio file for backing tracks/soundtracks';
COMMENT ON COLUMN shop_products.audio_filename IS 'Filename of the uploaded audio file';
COMMENT ON COLUMN shop_products.is_digital_product IS 'True if this is a digital product (backing track) that should be delivered via email';

-- Add audio_file_url to shop_order_items so we can send download links in emails
ALTER TABLE shop_order_items
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;

COMMENT ON COLUMN shop_order_items.audio_file_url IS 'URL to the audio file for digital products (backing tracks) at the time of order';

-- Create storage policies for audio files in the 'images' bucket
-- Policy to allow authenticated admins to upload audio files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to upload audio files'
  ) THEN
    CREATE POLICY "Allow admins to upload audio files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'backing-tracks' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- Policy to allow public read access to audio files (for downloads)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to audio files'
  ) THEN
    CREATE POLICY "Allow public read access to audio files" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'backing-tracks'
    );
  END IF;
END $$;

-- Policy to allow admins to update audio files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to update audio files'
  ) THEN
    CREATE POLICY "Allow admins to update audio files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'backing-tracks' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- Policy to allow admins to delete audio files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to delete audio files'
  ) THEN
    CREATE POLICY "Allow admins to delete audio files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'backing-tracks' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;
