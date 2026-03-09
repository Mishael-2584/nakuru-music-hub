-- Add home lesson duration for Music home lessons: 30 min (KSh 6,000) or 1 hour (KSh 10,000)
-- Only applies when learning_mode is home and course_category is Music. At the academy = KSh 4,800.
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS home_lesson_duration TEXT;

COMMENT ON COLUMN public.registrations.home_lesson_duration IS 'For home Music lessons only: 30_min (KSh 6,000/mo) or 1_hour (KSh 10,000/mo). Null for non-home or non-Music.';
