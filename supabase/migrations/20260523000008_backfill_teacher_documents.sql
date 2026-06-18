-- Backfill teacher_documents from teachers.cv_file_path for approved teachers
-- whose application documents were not migrated during approval.

INSERT INTO public.teacher_documents (teacher_id, doc_type, file_path, file_name, status)
SELECT
  t.id,
  'cv',
  t.cv_file_path,
  COALESCE(
    NULLIF(regexp_replace(t.cv_file_path, '^.*/', ''), ''),
    'cv.pdf'
  ),
  'approved'
FROM public.teachers t
WHERE t.cv_file_path IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.teacher_documents td
    WHERE td.teacher_id = t.id
      AND td.doc_type = 'cv'
      AND td.file_path = t.cv_file_path
  );
