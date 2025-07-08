-- Migration: Add user_id to teachers and backfill
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id UUID;

-- Backfill user_id by matching email to auth.users
UPDATE public.teachers t
SET user_id = u.id
FROM auth.users u
WHERE t.email = u.email;

-- Add unique constraint for user_id
ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_unique UNIQUE (user_id); 