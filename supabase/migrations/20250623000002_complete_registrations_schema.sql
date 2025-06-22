-- Complete the registrations table schema to match the form requirements
-- Add any missing fields and ensure all form data can be stored

-- Add medical condition fields if they don't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS medical_condition TEXT DEFAULT 'no',
ADD COLUMN IF NOT EXISTS medical_details TEXT;

-- Add country code field if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+254';

-- Add production_type field if it doesn't exist (for production courses)
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS production_type TEXT;

-- Ensure all required fields have proper defaults and constraints
ALTER TABLE public.registrations 
ALTER COLUMN course_category SET DEFAULT 'Music',
ALTER COLUMN proficiency_level SET DEFAULT 'beginner',
ALTER COLUMN learning_mode SET DEFAULT 'in-person',
ALTER COLUMN owns_instrument SET DEFAULT false,
ALTER COLUMN status SET DEFAULT 'pending';

-- Add comments to document all fields
COMMENT ON COLUMN public.registrations.student_name IS 'Full name of the student';
COMMENT ON COLUMN public.registrations.age IS 'Age of the student';
COMMENT ON COLUMN public.registrations.email IS 'Email address of the student';
COMMENT ON COLUMN public.registrations.phone IS 'Phone number of the student';
COMMENT ON COLUMN public.registrations.country_code IS 'Country code for phone number';
COMMENT ON COLUMN public.registrations.parent_name IS 'Parent/guardian name (for minors)';
COMMENT ON COLUMN public.registrations.parent_phone IS 'Parent/guardian phone (for minors)';
COMMENT ON COLUMN public.registrations.course_category IS 'Course category: Music, Production, or Art';
COMMENT ON COLUMN public.registrations.instrument IS 'Instrument for music courses or subject for other courses';
COMMENT ON COLUMN public.registrations.production_type IS 'Production type: Music Production, Live Sound, Videography';
COMMENT ON COLUMN public.registrations.experience IS 'Current experience level';
COMMENT ON COLUMN public.registrations.proficiency_level IS 'Musical proficiency level: beginner, intermediate, advanced, unsure';
COMMENT ON COLUMN public.registrations.learning_mode IS 'Learning mode: in-person, home, online';
COMMENT ON COLUMN public.registrations.owns_instrument IS 'Whether the student owns the instrument they want to learn';
COMMENT ON COLUMN public.registrations.location IS 'Student location/city';
COMMENT ON COLUMN public.registrations.medical_condition IS 'Whether the student has any medical conditions: yes/no';
COMMENT ON COLUMN public.registrations.medical_details IS 'Details about medical conditions if any';
COMMENT ON COLUMN public.registrations.goals IS 'Learning goals and objectives';
COMMENT ON COLUMN public.registrations.preferred_schedule IS 'Preferred learning schedule';
COMMENT ON COLUMN public.registrations.status IS 'Registration status: pending, approved, rejected';

-- Update RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;
CREATE POLICY "Anyone can insert registrations" 
  ON public.registrations 
  FOR INSERT 
  WITH CHECK (true);

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_course_category ON public.registrations(course_category);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at); 