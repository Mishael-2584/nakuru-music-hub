-- Migration: Add date_of_birth to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.students.date_of_birth IS 'Date of birth for the student (YYYY-MM-DD)'; 