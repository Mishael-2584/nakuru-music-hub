-- Migration: Fix makeup_credits teacher_id foreign key constraint
-- Date: 2025-07-02

-- Drop the existing foreign key constraint
ALTER TABLE public.makeup_credits 
DROP CONSTRAINT IF EXISTS makeup_credits_teacher_id_fkey;

-- Add the correct foreign key constraint to reference public.teachers instead of auth.users
ALTER TABLE public.makeup_credits 
ADD CONSTRAINT makeup_credits_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Also fix the recurring_booking_patterns table if it has the same issue
ALTER TABLE public.recurring_booking_patterns 
DROP CONSTRAINT IF EXISTS recurring_booking_patterns_teacher_id_fkey;

ALTER TABLE public.recurring_booking_patterns 
ADD CONSTRAINT recurring_booking_patterns_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE; 