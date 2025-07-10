-- Migration: Add date_of_birth to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.registrations.date_of_birth IS 'Date of birth for the student (YYYY-MM-DD)'; 