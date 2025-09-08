-- Migration: Add scheduled_start_time column to instant_meetings table
-- This enables scheduling meetings for later while creating them instantly

-- Add the scheduled_start_time column
ALTER TABLE public.instant_meetings 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE;

-- Add index for scheduled_start_time for performance
CREATE INDEX IF NOT EXISTS idx_instant_meetings_scheduled_start_time ON public.instant_meetings(scheduled_start_time);

-- Update the status check constraint to include 'scheduled'
ALTER TABLE public.instant_meetings 
DROP CONSTRAINT IF EXISTS instant_meetings_status_check;

ALTER TABLE public.instant_meetings 
ADD CONSTRAINT instant_meetings_status_check 
CHECK (status IN ('scheduled', 'pending', 'active', 'completed', 'cancelled'));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instant_meetings TO authenticated;
GRANT ALL ON public.instant_meetings TO service_role;