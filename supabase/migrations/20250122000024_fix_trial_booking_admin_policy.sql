-- Ensure admin users (profiles.role in admin sets) can manage trial bookings
DROP POLICY IF EXISTS "Admins can manage all trial bookings" ON public.trial_bookings;

CREATE POLICY "Admins can manage all trial bookings" ON public.trial_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
    )
  );

-- Ensure grants remain intact
GRANT ALL ON public.trial_bookings TO authenticated;

