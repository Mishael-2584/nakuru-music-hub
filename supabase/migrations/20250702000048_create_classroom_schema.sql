-- Migration: Create Classroom schema (classrooms, enrollments, posts, comments) with RLS
-- Date: 2025-07-02

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  class_code TEXT UNIQUE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('invited','enrolled','left')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  author_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.classroom_posts(id) ON DELETE CASCADE,
  author_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  author_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own classrooms
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Teachers manage own classrooms'
  ) THEN
    CREATE POLICY "Teachers manage own classrooms" ON public.classrooms
      FOR ALL USING (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
      WITH CHECK (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Anyone can select approved classrooms; teachers can select own pending
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Select approved classrooms'
  ) THEN
    CREATE POLICY "Select approved classrooms" ON public.classrooms
      FOR SELECT USING (status = 'approved' OR teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Enrollments: students see own, teachers see enrollments in their classrooms
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Students view own enrollments'
  ) THEN
    CREATE POLICY "Students view own enrollments" ON public.classroom_enrollments
      FOR SELECT USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Teachers view classroom enrollments'
  ) THEN
    CREATE POLICY "Teachers view classroom enrollments" ON public.classroom_enrollments
      FOR SELECT USING (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
  END IF;
END $$;

-- Students can insert their own enrollment via code
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Students insert own enrollment'
  ) THEN
    CREATE POLICY "Students insert own enrollment" ON public.classroom_enrollments
      FOR INSERT WITH CHECK (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Posts: teacher author must own classroom
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_posts' AND policyname = 'Teachers manage posts in own classrooms'
  ) THEN
    CREATE POLICY "Teachers manage posts in own classrooms" ON public.classroom_posts
      FOR ALL USING (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())))
      WITH CHECK (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
  END IF;
END $$;

-- Comments: teachers or enrolled students can select; enrolled students can insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Comments selectable to members'
  ) THEN
    CREATE POLICY "Comments selectable to members" ON public.classroom_comments
      FOR SELECT USING (
        (author_teacher_id IS NOT NULL AND author_teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())) OR
        (author_student_id IS NOT NULL AND author_student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
        post_id IN (
          SELECT cp.id FROM public.classroom_posts cp
          JOIN public.classrooms c ON c.id = cp.classroom_id
          LEFT JOIN public.classroom_enrollments ce ON ce.classroom_id = c.id
          WHERE c.teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())
             OR ce.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Students insert comments if enrolled'
  ) THEN
    CREATE POLICY "Students insert comments if enrolled" ON public.classroom_comments
      FOR INSERT WITH CHECK (
        author_student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        AND post_id IN (
          SELECT cp.id FROM public.classroom_posts cp
          JOIN public.classrooms c ON c.id = cp.classroom_id
          JOIN public.classroom_enrollments ce ON ce.classroom_id = c.id AND ce.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_classroom ON public.classroom_enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_student ON public.classroom_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_posts_classroom ON public.classroom_posts(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_comments_post ON public.classroom_comments(post_id);


-- Date: 2025-07-02

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  class_code TEXT UNIQUE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('invited','enrolled','left')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (classroom_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  author_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.classroom_posts(id) ON DELETE CASCADE,
  author_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  author_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own classrooms
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Teachers manage own classrooms'
  ) THEN
    CREATE POLICY "Teachers manage own classrooms" ON public.classrooms
      FOR ALL USING (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
      WITH CHECK (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Anyone can select approved classrooms; teachers can select own pending
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Select approved classrooms'
  ) THEN
    CREATE POLICY "Select approved classrooms" ON public.classrooms
      FOR SELECT USING (status = 'approved' OR teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Enrollments: students see own, teachers see enrollments in their classrooms
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Students view own enrollments'
  ) THEN
    CREATE POLICY "Students view own enrollments" ON public.classroom_enrollments
      FOR SELECT USING (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Teachers view classroom enrollments'
  ) THEN
    CREATE POLICY "Teachers view classroom enrollments" ON public.classroom_enrollments
      FOR SELECT USING (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
  END IF;
END $$;

-- Students can insert their own enrollment via code
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Students insert own enrollment'
  ) THEN
    CREATE POLICY "Students insert own enrollment" ON public.classroom_enrollments
      FOR INSERT WITH CHECK (student_id = (SELECT id FROM public.students WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Posts: teacher author must own classroom
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_posts' AND policyname = 'Teachers manage posts in own classrooms'
  ) THEN
    CREATE POLICY "Teachers manage posts in own classrooms" ON public.classroom_posts
      FOR ALL USING (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())))
      WITH CHECK (classroom_id IN (SELECT id FROM public.classrooms WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
  END IF;
END $$;

-- Comments: teachers or enrolled students can select; enrolled students can insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Comments selectable to members'
  ) THEN
    CREATE POLICY "Comments selectable to members" ON public.classroom_comments
      FOR SELECT USING (
        (author_teacher_id IS NOT NULL AND author_teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())) OR
        (author_student_id IS NOT NULL AND author_student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
        post_id IN (
          SELECT cp.id FROM public.classroom_posts cp
          JOIN public.classrooms c ON c.id = cp.classroom_id
          LEFT JOIN public.classroom_enrollments ce ON ce.classroom_id = c.id
          WHERE c.teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid())
             OR ce.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Students insert comments if enrolled'
  ) THEN
    CREATE POLICY "Students insert comments if enrolled" ON public.classroom_comments
      FOR INSERT WITH CHECK (
        author_student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        AND post_id IN (
          SELECT cp.id FROM public.classroom_posts cp
          JOIN public.classrooms c ON c.id = cp.classroom_id
          JOIN public.classroom_enrollments ce ON ce.classroom_id = c.id AND ce.student_id = (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
      );
  END IF;
END $$;

-- 3) Indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_classroom ON public.classroom_enrollments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_enrollments_student ON public.classroom_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_posts_classroom ON public.classroom_posts(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_comments_post ON public.classroom_comments(post_id);

