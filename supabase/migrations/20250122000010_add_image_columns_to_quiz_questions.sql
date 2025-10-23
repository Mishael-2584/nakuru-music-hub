-- Add image-related columns to quiz_questions table
-- This migration adds the missing columns for quiz question images

ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS has_image_attachment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.quiz_questions.has_image_attachment IS 'Whether this question requires students to upload an image attachment';
COMMENT ON COLUMN public.quiz_questions.image_url IS 'URL of the reference image uploaded by the teacher';
COMMENT ON COLUMN public.quiz_questions.image_filename IS 'Original filename of the reference image';
