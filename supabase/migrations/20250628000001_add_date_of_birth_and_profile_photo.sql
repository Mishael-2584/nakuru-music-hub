-- Migration: Add date_of_birth and profile_photo_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN public.profiles.date_of_birth IS 'Date of birth for the user (YYYY-MM-DD)';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

COMMENT ON COLUMN public.profiles.profile_photo_url IS 'URL to the user profile photo stored in Supabase Storage'; 