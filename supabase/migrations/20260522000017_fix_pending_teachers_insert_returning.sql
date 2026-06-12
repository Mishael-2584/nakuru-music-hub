-- Old production bundle does: .from('pending_teachers').insert(...).select('id')
-- Postgres INSERT ... RETURNING also requires a matching SELECT RLS policy.
-- Without SELECT, signup fails with: new row violates row-level security policy.

DROP POLICY IF EXISTS "pending_teachers_signup_select_returning" ON public.pending_teachers;

CREATE POLICY "pending_teachers_signup_select_returning"
  ON public.pending_teachers
  FOR SELECT
  TO anon, authenticated
  USING (
    created_at >= (timezone('utc', now()) - interval '15 minutes')
  );

-- Ensure INSERT is open for all signup clients (old + new)
DROP POLICY IF EXISTS "pending_teachers_public_insert" ON public.pending_teachers;
DROP POLICY IF EXISTS "Anyone can insert pending teachers" ON public.pending_teachers;

CREATE POLICY "pending_teachers_public_insert"
  ON public.pending_teachers
  FOR INSERT
  WITH CHECK (true);

GRANT INSERT, SELECT ON public.pending_teachers TO anon, authenticated;
