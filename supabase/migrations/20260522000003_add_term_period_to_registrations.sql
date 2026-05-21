-- Which term a termly student is enrolling in (1st vs final)
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS term_period TEXT DEFAULT '1st_term';

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS term_period TEXT DEFAULT '1st_term';

COMMENT ON COLUMN public.registrations.term_period IS 'For termly courses: 1st_term or final_term';
COMMENT ON COLUMN public.students.term_period IS 'For termly courses: 1st_term or final_term';
