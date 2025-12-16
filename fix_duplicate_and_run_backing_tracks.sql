-- Fix duplicate migration issue and run backing tracks migrations
-- This will be run directly in Supabase SQL Editor

-- First, handle the duplicate migration issue
-- Check if migration 20250122000025 exists with a different name
DO $$
DECLARE
  existing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO existing_count
  FROM supabase_migrations.schema_migrations 
  WHERE version = '20250122000025';
  
  IF existing_count > 0 THEN
    RAISE NOTICE 'Migration 20250122000025 already exists. Skipping duplicate insertion.';
  END IF;
END $$;

-- ============================================
-- Migration 1: Add backing tracks/audio file support (20250205000003)
-- ============================================

-- Add audio file fields to shop_products table
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
ADD COLUMN IF NOT EXISTS audio_filename TEXT,
ADD COLUMN IF NOT EXISTS is_digital_product BOOLEAN DEFAULT false;

COMMENT ON COLUMN shop_products.audio_file_url IS 'URL to the audio file for backing tracks/soundtracks';
COMMENT ON COLUMN shop_products.audio_filename IS 'Filename of the uploaded audio file';
COMMENT ON COLUMN shop_products.is_digital_product IS 'True if this is a digital product (backing track) that should be delivered via email';

-- Add audio_file_url to shop_order_items
ALTER TABLE shop_order_items
ADD COLUMN IF NOT EXISTS audio_file_url TEXT;

COMMENT ON COLUMN shop_order_items.audio_file_url IS 'URL to the audio file for digital products (backing tracks) at the time of order';

-- Storage policies for backing-tracks folder
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

-- Mark migration 20250205000003 as applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations 
    WHERE version = '20250205000003'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
    VALUES ('20250205000003', 'add_backing_tracks_support', '');
    RAISE NOTICE 'Migration 20250205000003 marked as applied';
  ELSE
    RAISE NOTICE 'Migration 20250205000003 already exists';
  END IF;
END $$;

-- ============================================
-- Migration 2: Enhance with preview audio and score previews (20250205000004)
-- ============================================

-- Add preview audio and score preview fields
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS preview_audio_url TEXT,
ADD COLUMN IF NOT EXISTS preview_audio_filename TEXT,
ADD COLUMN IF NOT EXISTS score_preview_url TEXT,
ADD COLUMN IF NOT EXISTS score_preview_filename TEXT,
ADD COLUMN IF NOT EXISTS part_name TEXT;

COMMENT ON COLUMN shop_products.preview_audio_url IS 'URL to the preview audio file (short preview for customers)';
COMMENT ON COLUMN shop_products.preview_audio_filename IS 'Filename of the preview audio file';
COMMENT ON COLUMN shop_products.score_preview_url IS 'URL to the PDF score preview (first page shown to customers)';
COMMENT ON COLUMN shop_products.score_preview_filename IS 'Filename of the score preview PDF';
COMMENT ON COLUMN shop_products.part_name IS 'Name of the part/instrument (e.g., "Vocal Part", "Guitar Part") for multi-part songs';

-- Update category name
UPDATE shop_categories 
SET name = 'Performance Tracks & Scores',
    description = 'High-quality instrumental backing tracks and sheet music scores',
    updated_at = now()
WHERE slug = 'performance-tracks';

-- Storage policies for score-previews folder
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

-- Storage policies for preview-audio folder
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

-- Mark migration 20250205000004 as applied
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM supabase_migrations.schema_migrations 
    WHERE version = '20250205000004'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
    VALUES ('20250205000004', 'enhance_backing_tracks_with_previews', '');
    RAISE NOTICE 'Migration 20250205000004 marked as applied';
  ELSE
    RAISE NOTICE 'Migration 20250205000004 already exists';
  END IF;
END $$;

SELECT '✅ All backing tracks migrations completed successfully!' as status;
