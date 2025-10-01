-- Add meeting fields to trial_bookings table
-- This enables storing meeting URL and code for scheduled trial classes

ALTER TABLE public.trial_bookings 
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS meeting_code TEXT;

-- Add index for meeting code lookups
CREATE INDEX IF NOT EXISTS idx_trial_bookings_meeting_code ON public.trial_bookings(meeting_code);

-- Add comment for documentation
COMMENT ON COLUMN public.trial_bookings.meeting_url IS 'Jitsi Meet URL for the trial class';
COMMENT ON COLUMN public.trial_bookings.meeting_code IS 'Meeting code for joining the trial class';
