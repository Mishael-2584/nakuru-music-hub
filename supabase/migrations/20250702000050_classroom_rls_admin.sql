-- Migration: Add admin RLS policies for classroom management
-- Date: 2025-07-02

-- Helper predicate for admin check in RLS (inline subquery used)

-- Classrooms: admins can select/update/insert/delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Admins manage classrooms'
  ) THEN
    CREATE POLICY "Admins manage classrooms" ON public.classrooms
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Enrollments: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Admins view classroom enrollments'
  ) THEN
    CREATE POLICY "Admins view classroom enrollments" ON public.classroom_enrollments
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Posts: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_posts' AND policyname = 'Admins view classroom posts'
  ) THEN
    CREATE POLICY "Admins view classroom posts" ON public.classroom_posts
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Comments: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Admins view classroom comments'
  ) THEN
    CREATE POLICY "Admins view classroom comments" ON public.classroom_comments
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;


-- Date: 2025-07-02

-- Helper predicate for admin check in RLS (inline subquery used)

-- Classrooms: admins can select/update/insert/delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classrooms' AND policyname = 'Admins manage classrooms'
  ) THEN
    CREATE POLICY "Admins manage classrooms" ON public.classrooms
      FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Enrollments: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_enrollments' AND policyname = 'Admins view classroom enrollments'
  ) THEN
    CREATE POLICY "Admins view classroom enrollments" ON public.classroom_enrollments
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Posts: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_posts' AND policyname = 'Admins view classroom posts'
  ) THEN
    CREATE POLICY "Admins view classroom posts" ON public.classroom_posts
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

-- Comments: admins can select
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classroom_comments' AND policyname = 'Admins view classroom comments'
  ) THEN
    CREATE POLICY "Admins view classroom comments" ON public.classroom_comments
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
  END IF;
END $$;

