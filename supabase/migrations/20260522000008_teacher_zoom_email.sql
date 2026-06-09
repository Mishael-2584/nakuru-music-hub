-- Optional Zoom licensed email per teacher (when login email differs from Zoom account)
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS zoom_email TEXT;

COMMENT ON COLUMN public.teachers.zoom_email IS
  'Licensed Zoom user email on the academy Zoom account. Falls back to teachers.email when null.';

ALTER TABLE public.instant_meetings
  ADD COLUMN IF NOT EXISTS zoom_host_email TEXT;

ALTER TABLE public.instant_meetings
  ADD COLUMN IF NOT EXISTS alternative_host_email TEXT;

ALTER TABLE public.meeting_rooms
  ADD COLUMN IF NOT EXISTS zoom_host_email TEXT;

ALTER TABLE public.meeting_rooms
  ADD COLUMN IF NOT EXISTS alternative_host_email TEXT;
