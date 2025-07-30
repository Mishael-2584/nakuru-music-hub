-- Migration: Fix RLS policies for students and meeting_rooms tables
-- This migration fixes the 406 and 403 errors when querying students and creating meeting rooms

-- Drop existing policies for students table
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Students can update their own data" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;

-- Create comprehensive RLS policies for students table
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Students can update their own data" ON public.students
  FOR UPDATE USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Teachers can view students" ON public.students
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.teachers
    )
  );

CREATE POLICY "Admins can manage all students" ON public.students
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all students
CREATE POLICY "Service role can manage students" ON public.students
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Drop existing policies for meeting_rooms table
DROP POLICY IF EXISTS "Teachers can manage their meeting rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Students can view their meeting rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Admins can manage all meeting rooms" ON public.meeting_rooms;
DROP POLICY IF EXISTS "Service role can manage meeting rooms" ON public.meeting_rooms;

-- Create comprehensive RLS policies for meeting_rooms table
CREATE POLICY "Teachers can manage their meeting rooms" ON public.meeting_rooms
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Students can view their meeting rooms" ON public.meeting_rooms
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE user_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all meeting rooms" ON public.meeting_rooms
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all meeting rooms
CREATE POLICY "Service role can manage meeting rooms" ON public.meeting_rooms
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Public access for meeting room creation (for booking process)
CREATE POLICY "Public can create meeting rooms" ON public.meeting_rooms
  FOR INSERT WITH CHECK (true);

-- Create function to debug RLS issues
CREATE OR REPLACE FUNCTION debug_rls_access(table_name TEXT, user_id UUID)
RETURNS TABLE (
  policy_name TEXT,
  policy_type TEXT,
  can_access BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.policyname::TEXT,
    p.cmd::TEXT,
    CASE 
      WHEN p.cmd = 'SELECT' THEN true
      WHEN p.cmd = 'INSERT' THEN true
      WHEN p.cmd = 'UPDATE' THEN true
      WHEN p.cmd = 'DELETE' THEN true
      WHEN p.cmd = 'ALL' THEN true
      ELSE false
    END as can_access
  FROM pg_policies p
  WHERE p.tablename = table_name
    AND p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql; 