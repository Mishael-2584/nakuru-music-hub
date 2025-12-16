-- Migration: Enhance backing tracks with preview audio, full audio, and optional PDF score preview
-- Date: 2025-02-05

-- Add preview audio and score preview fields to shop_products
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS preview_audio_url TEXT,
ADD COLUMN IF NOT EXISTS preview_audio_filename TEXT,
ADD COLUMN IF NOT EXISTS score_preview_url TEXT,
ADD COLUMN IF NOT EXISTS score_preview_filename TEXT,
ADD COLUMN IF NOT EXISTS part_name TEXT; -- e.g., "Vocal Part", "Guitar Part", "Piano Part"

-- Add comments for clarity
COMMENT ON COLUMN shop_products.preview_audio_url IS 'URL to the preview audio file (short preview for customers)';
COMMENT ON COLUMN shop_products.preview_audio_filename IS 'Filename of the preview audio file';
COMMENT ON COLUMN shop_products.score_preview_url IS 'URL to the PDF score preview (first page shown to customers)';
COMMENT ON COLUMN shop_products.score_preview_filename IS 'Filename of the score preview PDF';
COMMENT ON COLUMN shop_products.part_name IS 'Name of the part/instrument (e.g., "Vocal Part", "Guitar Part") for multi-part songs';

-- Update category name from "Performance Tracks" to "Performance Tracks & Scores"
UPDATE shop_categories 
SET name = 'Performance Tracks & Scores',
    description = 'High-quality instrumental backing tracks and sheet music scores',
    updated_at = now()
WHERE slug = 'performance-tracks';

-- Create storage policies for PDF score previews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to upload score previews'
  ) THEN
    CREATE POLICY "Allow admins to upload score previews" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'score-previews' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to score previews'
  ) THEN
    CREATE POLICY "Allow public read access to score previews" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'score-previews'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to update score previews'
  ) THEN
    CREATE POLICY "Allow admins to update score previews" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'score-previews' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to delete score previews'
  ) THEN
    CREATE POLICY "Allow admins to delete score previews" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'score-previews' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

-- Update storage policies for preview audio (separate from full audio)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to upload preview audio'
  ) THEN
    CREATE POLICY "Allow admins to upload preview audio" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'preview-audio' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public read access to preview audio'
  ) THEN
    CREATE POLICY "Allow public read access to preview audio" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'preview-audio'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to update preview audio'
  ) THEN
    CREATE POLICY "Allow admins to update preview audio" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'preview-audio' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow admins to delete preview audio'
  ) THEN
    CREATE POLICY "Allow admins to delete preview audio" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'images' AND 
      (storage.foldername(name))[1] = 'preview-audio' AND
      auth.role() = 'authenticated' AND
      auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    );
  END IF;
END $$;
