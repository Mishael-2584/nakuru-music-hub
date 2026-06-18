-- Fix infinite recursion in students RLS policies.
-- The teacher policy queried bookings/lessons/enrollments, whose policies query students again.
-- Use SECURITY DEFINER helpers so relationship checks bypass RLS.

CREATE OR REPLACE FUNCTION public.auth_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.auth_is_teacher_of_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teachers t
    WHERE t.user_id = auth.uid()
      AND (
        EXISTS (
          SELECT 1
          FROM public.bookings b
          WHERE b.student_id = p_student_id
            AND b.teacher_id = t.id
        )
        OR EXISTS (
          SELECT 1
          FROM public.classroom_enrollments ce
          INNER JOIN public.classrooms c ON c.id = ce.classroom_id
          WHERE ce.student_id = p_student_id
            AND c.teacher_id = t.id
            AND ce.status IN ('enrolled', 'invited')
        )
        OR EXISTS (
          SELECT 1
          FROM public.lessons l
          WHERE l.student_id = p_student_id
            AND l.teacher_id = t.id
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.auth_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_is_teacher_of_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_is_teacher_of_student(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins can select all students" ON public.students;
DROP POLICY IF EXISTS "Admins can update all students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Teachers can select their students" ON public.students;

CREATE POLICY "Admins can select all students"
ON public.students
FOR SELECT
TO authenticated
USING (public.auth_is_admin());

CREATE POLICY "Admins can update all students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.auth_is_admin())
WITH CHECK (public.auth_is_admin());

CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.auth_is_admin());

CREATE POLICY "Teachers can select their students"
ON public.students
FOR SELECT
TO authenticated
USING (public.auth_is_teacher_of_student(id));

COMMENT ON FUNCTION public.auth_is_teacher_of_student(uuid) IS
  'RLS-safe check: teacher linked to student via bookings, classroom enrollments, or lessons.';
