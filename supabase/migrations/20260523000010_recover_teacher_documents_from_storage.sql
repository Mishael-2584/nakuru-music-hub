-- Recover teacher application documents from storage.objects and link them in teacher_documents.
-- Signup uploads use: {email_prefix}_{timestamp}_{random}_{doc_type}.{ext}
-- Post-approval uploads use: teachers/{teacher_id}/{doc_type}/{filename}

CREATE OR REPLACE FUNCTION public.recover_teacher_documents_from_storage_impl(
  p_teacher_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_inserted integer := 0;
  v_cv_updated integer := 0;
BEGIN
  WITH teacher_scope AS (
    SELECT
      t.id AS teacher_id,
      t.email,
      regexp_replace(lower(t.email), '[^a-z0-9]', '_', 'g') AS email_prefix
    FROM public.teachers t
    WHERE p_teacher_id IS NULL OR t.id = p_teacher_id
  ),
  signup_files AS (
    SELECT
      ts.teacher_id,
      o.name AS file_path,
      o.created_at,
      (regexp_match(o.name, '_(cv|id|kra|certificate|transcript)\.([^.]+)$'))[1] AS doc_type
    FROM teacher_scope ts
    INNER JOIN storage.objects o
      ON o.bucket_id = 'teacher-cvs'
      AND o.name LIKE ts.email_prefix || '_%'
      AND o.name ~ '_(cv|id|kra|certificate|transcript)\.[^./]+$'
      AND o.name NOT LIKE 'teachers/%'
  ),
  portal_files AS (
    SELECT
      ts.teacher_id,
      o.name AS file_path,
      o.created_at,
      split_part(o.name, '/', 3) AS doc_type
    FROM teacher_scope ts
    INNER JOIN storage.objects o
      ON o.bucket_id = 'teacher-cvs'
      AND o.name LIKE 'teachers/' || ts.teacher_id::text || '/%'
      AND split_part(o.name, '/', 3) IN ('cv', 'id', 'kra', 'certificate', 'transcript')
  ),
  all_files AS (
    SELECT * FROM signup_files
    UNION ALL
    SELECT * FROM portal_files
  ),
  inserted AS (
    INSERT INTO public.teacher_documents (
      teacher_id,
      doc_type,
      file_path,
      file_name,
      status
    )
    SELECT
      af.teacher_id,
      af.doc_type,
      af.file_path,
      regexp_replace(af.file_path, '^.*/', ''),
      'approved'
    FROM all_files af
    WHERE af.doc_type IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.teacher_documents td
        WHERE td.teacher_id = af.teacher_id
          AND td.file_path = af.file_path
      )
    RETURNING 1
  )
  SELECT COUNT(*)::integer INTO v_inserted FROM inserted;

  WITH teacher_scope AS (
    SELECT
      t.id AS teacher_id,
      t.email,
      regexp_replace(lower(t.email), '[^a-z0-9]', '_', 'g') AS email_prefix
    FROM public.teachers t
    WHERE p_teacher_id IS NULL OR t.id = p_teacher_id
  ),
  cv_files AS (
    SELECT DISTINCT ON (ts.teacher_id)
      ts.teacher_id,
      o.name AS file_path
    FROM teacher_scope ts
    INNER JOIN storage.objects o
      ON o.bucket_id = 'teacher-cvs'
      AND (
        (
          o.name LIKE ts.email_prefix || '_%'
          AND o.name ~ '_(cv|id|kra|certificate|transcript)\.[^./]+$'
          AND o.name NOT LIKE 'teachers/%'
          AND o.name ~ '_cv\.[^./]+$'
        )
        OR o.name LIKE 'teachers/' || ts.teacher_id::text || '/cv/%'
      )
    ORDER BY ts.teacher_id, o.created_at DESC
  ),
  updated AS (
    UPDATE public.teachers t
    SET cv_file_path = cf.file_path
    FROM cv_files cf
    WHERE t.id = cf.teacher_id
      AND (t.cv_file_path IS NULL OR t.cv_file_path = '')
    RETURNING 1
  )
  SELECT COUNT(*)::integer INTO v_cv_updated FROM updated;

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'cv_updated', v_cv_updated
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.recover_teacher_documents_from_storage(
  p_teacher_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.auth_is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN public.recover_teacher_documents_from_storage_impl(p_teacher_id);
END;
$$;

REVOKE ALL ON FUNCTION public.recover_teacher_documents_from_storage_impl(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recover_teacher_documents_from_storage_impl(uuid) TO postgres, service_role;

REVOKE ALL ON FUNCTION public.recover_teacher_documents_from_storage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recover_teacher_documents_from_storage(uuid) TO authenticated;

-- One-time backfill for teachers approved before document migration existed.
SELECT public.recover_teacher_documents_from_storage_impl(NULL);

COMMENT ON FUNCTION public.recover_teacher_documents_from_storage(uuid) IS
  'Admin-only: scan teacher-cvs storage and link orphaned signup/portal files to teacher_documents.';
