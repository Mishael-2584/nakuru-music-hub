-- Add missing course category fields to students table
-- This ensures that course_category, production_type, and technology_type are available in the students table

-- Add course_category column if it doesn't exist
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS course_category TEXT;

-- Add production_type column if it doesn't exist
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS production_type TEXT;

-- Add technology_type column if it doesn't exist
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS technology_type TEXT;

-- Update existing students to have course_category from their registrations
UPDATE public.students s
SET course_category = r.course_category,
    production_type = r.production_type,
    technology_type = r.technology_type
FROM public.registrations r
WHERE s.registration_id = r.id
AND (s.course_category IS NULL OR s.production_type IS NULL OR s.technology_type IS NULL);

-- Add comments to document the new fields
COMMENT ON COLUMN public.students.course_category IS 'Course category: Music, Production, Art, or Technology';
COMMENT ON COLUMN public.students.production_type IS 'Production type: Music Production, Live Sound, Videography, etc.';
COMMENT ON COLUMN public.students.technology_type IS 'Technology type: Web Design & Programming, Mobile App Development, etc.';
