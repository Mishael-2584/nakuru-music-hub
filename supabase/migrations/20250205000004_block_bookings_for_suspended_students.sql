-- Add RLS policy to block bookings for suspended students
-- This ensures that even if someone bypasses frontend checks, database will reject bookings

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings;

-- Create new policy that checks for account suspension
CREATE POLICY "Students can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
      AND (account_suspended IS NULL OR account_suspended = FALSE)
      AND (is_access_suspended IS NULL OR is_access_suspended = FALSE)
    )
  );

-- Also update the update policy to prevent suspended students from modifying bookings
DROP POLICY IF EXISTS "Students can update their own bookings" ON public.bookings;

CREATE POLICY "Students can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
      AND (account_suspended IS NULL OR account_suspended = FALSE)
      AND (is_access_suspended IS NULL OR is_access_suspended = FALSE)
    )
  );

-- Record this migration in the tracking table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'supabase_migrations' 
    AND table_name = 'schema_migrations'
  ) THEN
    INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
    VALUES (
      '20250205000004',
      ARRAY[
        'DROP POLICY IF EXISTS "Students can create bookings" ON public.bookings;',
        'CREATE POLICY "Students can create bookings" ON public.bookings FOR INSERT WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid() AND (account_suspended IS NULL OR account_suspended = FALSE) AND (is_access_suspended IS NULL OR is_access_suspended = FALSE)));',
        'DROP POLICY IF EXISTS "Students can update their own bookings" ON public.bookings;',
        'CREATE POLICY "Students can update their own bookings" ON public.bookings FOR UPDATE USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid() AND (account_suspended IS NULL OR account_suspended = FALSE) AND (is_access_suspended IS NULL OR is_access_suspended = FALSE)));'
      ],
      'block_bookings_for_suspended_students'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;

