-- Add missing fields to registrations table to match the form requirements
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS course_category TEXT,
ADD COLUMN IF NOT EXISTS proficiency_level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS learning_mode TEXT DEFAULT 'in-person',
ADD COLUMN IF NOT EXISTS owns_instrument BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS medical_condition TEXT,
ADD COLUMN IF NOT EXISTS medical_details TEXT;

-- Update existing records to have default values for new required fields
UPDATE public.registrations 
SET course_category = 'Music' 
WHERE course_category IS NULL;

UPDATE public.registrations 
SET proficiency_level = 'beginner' 
WHERE proficiency_level IS NULL;

UPDATE public.registrations 
SET learning_mode = 'in-person' 
WHERE learning_mode IS NULL;

UPDATE public.registrations 
SET owns_instrument = false 
WHERE owns_instrument IS NULL;

-- Add comments to document the new fields
COMMENT ON COLUMN public.registrations.course_category IS 'Course category: Music, Production, or Art';
COMMENT ON COLUMN public.registrations.proficiency_level IS 'Musical proficiency level: beginner, intermediate, advanced, unsure';
COMMENT ON COLUMN public.registrations.learning_mode IS 'Learning mode: in-person, home, online';
COMMENT ON COLUMN public.registrations.owns_instrument IS 'Whether the student owns the instrument they want to learn';
COMMENT ON COLUMN public.registrations.location IS 'Student location/city';
COMMENT ON COLUMN public.registrations.medical_condition IS 'Whether the student has any medical conditions';
COMMENT ON COLUMN public.registrations.medical_details IS 'Details about medical conditions if any'; 