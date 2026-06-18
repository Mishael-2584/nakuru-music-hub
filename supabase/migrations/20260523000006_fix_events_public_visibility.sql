-- Only expose published events to the public; admins still see all events
-- Date: 2026-05-23

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

CREATE POLICY "Anyone can view published events"
  ON public.events
  FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

COMMENT ON POLICY "Anyone can view published events" ON public.events IS
  'Public site visitors only see published events; admins can see drafts in the panel.';
