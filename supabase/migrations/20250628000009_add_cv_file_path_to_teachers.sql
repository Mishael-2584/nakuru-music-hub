-- Add cv_file_path to pending_teachers
ALTER TABLE public.pending_teachers ADD COLUMN cv_file_path text;

-- Add cv_file_path to teachers
ALTER TABLE public.teachers ADD COLUMN cv_file_path text; 