-- Add missing selected_time_slot_id column to trial_bookings table
-- This column stores which time slot the student selected during booking

ALTER TABLE public.trial_bookings
ADD COLUMN IF NOT EXISTS selected_time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_trial_bookings_time_slot ON public.trial_bookings(selected_time_slot_id);

-- Add comment for clarity
COMMENT ON COLUMN public.trial_bookings.selected_time_slot_id IS 'The time slot selected by the student during trial booking';
