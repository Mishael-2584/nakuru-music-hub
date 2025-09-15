-- Add avatar_url to teachers and create teacher documents + change requests

-- 1) Add avatar_url column
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) Table: teacher_documents (for approved teachers)
CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- e.g. 'cv', 'id', 'kra', 'transcript', 'certificate'
  file_path text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  review_notes text
);

ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;

-- Policies: teachers can manage their own docs (insert/select), admins can manage all
DROP POLICY IF EXISTS "Teachers can view own documents" ON public.teacher_documents;
CREATE POLICY "Teachers can view own documents" ON public.teacher_documents
FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.teachers t WHERE t.id = teacher_id));

DROP POLICY IF EXISTS "Teachers can insert own documents" ON public.teacher_documents;
CREATE POLICY "Teachers can insert own documents" ON public.teacher_documents
FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.teachers t WHERE t.id = teacher_id));

DROP POLICY IF EXISTS "Admins manage teacher documents" ON public.teacher_documents;
CREATE POLICY "Admins manage teacher documents" ON public.teacher_documents
FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','super_admin')));

-- 3) Table: teacher_profile_change_requests (for bio/phone etc edits requiring approval)
CREATE TABLE IF NOT EXISTS public.teacher_profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  proposed_name text,
  proposed_phone text,
  proposed_bio text,
  proposed_experience text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  review_notes text
);

ALTER TABLE public.teacher_profile_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own change requests" ON public.teacher_profile_change_requests;
CREATE POLICY "Teachers can view own change requests" ON public.teacher_profile_change_requests
FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.teachers t WHERE t.id = teacher_id));

DROP POLICY IF EXISTS "Teachers can insert own change requests" ON public.teacher_profile_change_requests;
CREATE POLICY "Teachers can insert own change requests" ON public.teacher_profile_change_requests
FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.teachers t WHERE t.id = teacher_id));

DROP POLICY IF EXISTS "Admins manage change requests" ON public.teacher_profile_change_requests;
CREATE POLICY "Admins manage change requests" ON public.teacher_profile_change_requests
FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','super_admin')));

-- 4) Pending teacher documents for applications
CREATE TABLE IF NOT EXISTS public.pending_teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pending_teacher_id uuid NOT NULL REFERENCES public.pending_teachers(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- 'cv','id','kra','transcript','certificate'
  file_path text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_teacher_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage pending teacher documents" ON public.pending_teacher_documents;
CREATE POLICY "Admins manage pending teacher documents" ON public.pending_teacher_documents
FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','super_admin')));

-- 5) Storage policies: allow teacher avatars in images/teacher-avatars/*
DROP POLICY IF EXISTS "Teachers upload avatars" ON storage.objects;
CREATE POLICY "Teachers upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' AND (storage.foldername(name))[1] = 'teacher-avatars' AND
  auth.uid() IN (SELECT user_id FROM public.teachers)
);

DROP POLICY IF EXISTS "Public read teacher avatars" ON storage.objects;
CREATE POLICY "Public read teacher avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'images' AND (storage.foldername(name))[1] = 'teacher-avatars');

-- 6) Ensure teacher-cvs bucket is used for documents (read-only public URLs ok)
-- Allow teachers to upload into teacher-cvs under teachers/{teacher_id}/*
DROP POLICY IF EXISTS "Teachers upload own documents to teacher-cvs" ON storage.objects;
CREATE POLICY "Teachers upload own documents to teacher-cvs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'teacher-cvs' AND auth.uid() IN (SELECT user_id FROM public.teachers)
);

DROP POLICY IF EXISTS "Admins manage teacher-cvs" ON storage.objects;
CREATE POLICY "Admins manage teacher-cvs" ON storage.objects
FOR ALL USING (bucket_id = 'teacher-cvs' AND auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin','super_admin')));


