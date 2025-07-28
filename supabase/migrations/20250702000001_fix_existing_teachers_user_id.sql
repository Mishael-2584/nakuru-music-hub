-- Migration: Fix existing teachers who don't have user_id set
-- This migration ensures all existing teachers have a proper user_id

-- 1. First, ensure all teachers have a user_id by matching email to auth.users
UPDATE public.teachers t
SET user_id = u.id
FROM auth.users u
WHERE t.email = u.email AND t.user_id IS NULL;

-- 2. For any teachers that still don't have a user_id, we need to create auth users for them
-- This will be handled by the admin when they approve teachers

-- 3. Add an index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);

-- Note: We don't add NOT NULL constraint yet because there might be existing teachers
-- without auth users. The constraint will be added in a future migration after
-- all existing teachers have been properly handled. 