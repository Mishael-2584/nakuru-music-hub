-- Zoom: host start URL + meeting id (participant join URL stays in meeting_url)

ALTER TABLE public.meeting_rooms
ADD COLUMN IF NOT EXISTS meeting_host_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;

ALTER TABLE public.instant_meetings
ADD COLUMN IF NOT EXISTS meeting_host_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;

ALTER TABLE public.trial_bookings
ADD COLUMN IF NOT EXISTS meeting_host_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;

-- Allow up to 100 participants on instant meetings (Zoom license)
ALTER TABLE public.instant_meetings
DROP CONSTRAINT IF EXISTS instant_meetings_max_participants_check;

ALTER TABLE public.instant_meetings
ADD CONSTRAINT instant_meetings_max_participants_check
CHECK (max_participants > 0 AND max_participants <= 100);

COMMENT ON COLUMN public.meeting_rooms.meeting_url IS 'Zoom join URL for participants';
COMMENT ON COLUMN public.meeting_rooms.meeting_host_url IS 'Zoom start URL for meeting host (creator)';
COMMENT ON COLUMN public.instant_meetings.meeting_host_url IS 'Zoom start URL for meeting host (creator)';
