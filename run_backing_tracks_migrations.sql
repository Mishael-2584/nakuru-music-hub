-- Combined Migration: Backing Tracks Support with Previews
-- Run this in your Supabase SQL Editor
-- Date: 2025-02-05

-- ============================================
-- Migration 1: Add backing tracks/audio file support
-- ============================================

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

-- ============================================
-- Migration 2: Enhance with preview audio and score previews
-- ============================================

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migrations completed successfully!';
  RAISE NOTICE '✅ Backing tracks support added';
  RAISE NOTICE '✅ Preview audio and score preview support added';
  RAISE NOTICE '✅ Category name updated to "Performance Tracks & Scores"';
END $$;


