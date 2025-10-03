-- Migration: Add time slot reference to trial bookings table
-- This allows trial bookings to be linked to specific teacher time slots

-- Add the selected_time_slot_id column to trial_bookings table
ALTER TABLE public.trial_bookings 
ADD COLUMN IF NOT EXISTS selected_time_slot_id UUID REFERENCES public.time_slots(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_trial_bookings_selected_time_slot ON public.trial_bookings(selected_time_slot_id);

-- Update the status check constraint to include 'scheduled' status
ALTER TABLE public.trial_bookings 
DROP CONSTRAINT IF EXISTS trial_bookings_status_check;

ALTER TABLE public.trial_bookings 
ADD CONSTRAINT trial_bookings_status_check 
CHECK (status IN ('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'converted'));

