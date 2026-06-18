-- Restore student visibility for teachers and admins (required for messaging)
-- The simplify migration removed admin/teacher SELECT policies, breaking recipient search.
-- Date: 2026-05-23

DROP POLICY IF EXISTS "Admins can select all students" ON public.students;
DROP POLICY IF EXISTS "Admins can update all students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers can select their students" ON public.students;

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

CREATE POLICY "Teachers can select their students"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.teachers t
    WHERE t.user_id = auth.uid()
      AND (
        EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.student_id = students.id
            AND b.teacher_id = t.id
        )
        OR EXISTS (
          SELECT 1
          FROM public.classroom_enrollments ce
          INNER JOIN public.classrooms c ON c.id = ce.classroom_id
          WHERE ce.student_id = students.id
            AND c.teacher_id = t.id
            AND ce.status IN ('enrolled', 'invited')
        )
        OR EXISTS (
          SELECT 1
          FROM public.lessons l
          WHERE l.student_id = students.id
            AND l.teacher_id = t.id
        )
      )
  )
);

COMMENT ON POLICY "Teachers can select their students" ON public.students IS
  'Teachers can load students they teach via bookings, lessons, or classroom enrollments (for messaging and dashboards).';
