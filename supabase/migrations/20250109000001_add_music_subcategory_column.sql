-- Add missing music_subcategory column to registrations table
-- This column is required by the registration form but was missing from the schema

ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS music_subcategory TEXT;

-- Add comment to document the field
COMMENT ON COLUMN public.registrations.music_subcategory IS 'Music subcategory: Individual Lessons, DMA Kids Band, DMA Children''s Choir';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_music_subcategory ON public.registrations(music_subcategory);
