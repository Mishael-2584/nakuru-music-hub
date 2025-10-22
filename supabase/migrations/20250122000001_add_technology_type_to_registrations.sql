/*
  # Add technology_type column to registrations table
  
  This migration adds the technology_type column to the registrations table
  to support Technology course enrollments.
*/

-- Add technology_type column to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS technology_type TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.registrations.technology_type IS 'Technology course type for Technology category enrollments (e.g., Web Design & Programming, Mobile App Development)';
