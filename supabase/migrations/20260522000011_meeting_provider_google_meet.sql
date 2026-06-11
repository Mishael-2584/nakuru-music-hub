-- Track video provider (Zoom vs Google Meet fallback for concurrent classes)

ALTER TABLE public.instant_meetings
  ADD COLUMN IF NOT EXISTS meeting_provider TEXT NOT NULL DEFAULT 'zoom'
    CHECK (meeting_provider IN ('zoom', 'google_meet')),
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_note TEXT;

ALTER TABLE public.meeting_rooms
  ADD COLUMN IF NOT EXISTS meeting_provider TEXT NOT NULL DEFAULT 'zoom'
    CHECK (meeting_provider IN ('zoom', 'google_meet')),
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_note TEXT;

CREATE INDEX IF NOT EXISTS idx_instant_meetings_provider_status
  ON public.instant_meetings (meeting_provider, status);

CREATE INDEX IF NOT EXISTS idx_meeting_rooms_provider_status
  ON public.meeting_rooms (meeting_provider, status);

COMMENT ON COLUMN public.instant_meetings.meeting_provider IS
  'zoom = academy Zoom license; google_meet = fallback when Zoom is at concurrent capacity';
COMMENT ON COLUMN public.meeting_rooms.meeting_provider IS
  'zoom = academy Zoom license; google_meet = fallback when Zoom is at concurrent capacity';
