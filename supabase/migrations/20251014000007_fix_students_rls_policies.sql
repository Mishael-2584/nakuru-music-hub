-- Fix RLS policies for students table to allow students to access their own data
-- Date: 2025-10-14

-- First, let's check and fix the students table RLS policies
-- Enable RLS if not already enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies that might be causing issues
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
DROP POLICY IF EXISTS "Students can view own data" ON public.students;
DROP POLICY IF EXISTS "Students can update own data" ON public.students;

-- Create comprehensive policies for students

-- 1. Students can SELECT their own data
CREATE POLICY "Students can select own data"
ON public.students
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- 2. Students can UPDATE their own data
CREATE POLICY "Students can update own data"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Admins can SELECT all student data
CREATE POLICY "Admins can select all students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Admins can UPDATE all student data
CREATE POLICY "Admins can update all students"
ON public.students
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 5. Admins can INSERT student data
CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 6. Teachers can SELECT students enrolled in their classrooms
CREATE POLICY "Teachers can select their students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  )
  AND EXISTS (
    SELECT 1 FROM public.classroom_enrollments ce
    INNER JOIN public.classrooms c ON ce.classroom_id = c.id
    INNER JOIN public.teachers t ON c.teacher_id = t.id
    WHERE ce.student_id = students.id
    AND t.user_id = auth.uid()
    AND ce.status = 'active'
  )
);

-- Add comment for documentation
COMMENT ON TABLE public.students IS 'Student profiles with RLS policies: students can view/update own data, admins have full access, teachers can view enrolled students';

