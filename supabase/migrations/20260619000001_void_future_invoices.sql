-- Void mistakenly generated future-month invoices (billing only runs through the current month).

CREATE OR REPLACE FUNCTION public.preview_future_invoices()
RETURNS TABLE (
  invoice_id UUID,
  student_id UUID,
  student_name TEXT,
  period_start DATE,
  period_end DATE,
  amount_due NUMERIC,
  status TEXT,
  payment_status TEXT,
  has_payments BOOLEAN,
  can_void BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id AS invoice_id,
    i.student_id,
    s.student_name,
    i.period_start,
    i.period_end,
    i.amount_due,
    i.status,
    i.payment_status,
    EXISTS (
      SELECT 1
      FROM payments p
      WHERE p.invoice_id = i.id
        AND p.status = 'completed'
    ) AS has_payments,
    (
      COALESCE(i.status, 'pending') NOT IN ('paid', 'cancelled')
      AND COALESCE(i.payment_status, 'pending') <> 'paid'
      AND NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.invoice_id = i.id
          AND p.status = 'completed'
      )
    ) AS can_void
  FROM invoices i
  LEFT JOIN students s ON s.id = i.student_id
  WHERE date_trunc('month', i.period_start::timestamp) > date_trunc('month', CURRENT_DATE)
    AND COALESCE(i.status, 'pending') <> 'cancelled'
  ORDER BY i.period_start DESC, s.student_name;
$$;

CREATE OR REPLACE FUNCTION public.void_future_invoices(p_dry_run BOOLEAN DEFAULT TRUE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_count INTEGER := 0;
  v_voided_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_rows JSONB;
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'invoice_id', invoice_id,
          'student_name', student_name,
          'period_start', period_start,
          'period_end', period_end,
          'amount_due', amount_due,
          'status', status,
          'can_void', can_void
        )
        ORDER BY period_start DESC
      ),
      '[]'::jsonb
    )
  INTO v_target_count, v_rows
  FROM public.preview_future_invoices();

  v_skipped_count := (
    SELECT COUNT(*)::INTEGER
    FROM public.preview_future_invoices()
    WHERE NOT can_void
  );

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'dry_run', TRUE,
      'future_count', v_target_count,
      'voidable_count', v_target_count - v_skipped_count,
      'skipped_count', v_skipped_count,
      'invoices', v_rows
    );
  END IF;

  WITH voided AS (
    UPDATE invoices i
    SET
      status = 'cancelled',
      notes = COALESCE(i.notes || ' ', '') || '[Voided: future billing period removed on ' || CURRENT_DATE || ']',
      updated_at = NOW()
    FROM public.preview_future_invoices() p
    WHERE i.id = p.invoice_id
      AND p.can_void
    RETURNING i.id
  )
  SELECT COUNT(*)::INTEGER INTO v_voided_count FROM voided;

  RETURN jsonb_build_object(
    'dry_run', FALSE,
    'future_count', v_target_count,
    'voided_count', v_voided_count,
    'skipped_count', v_skipped_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_future_invoices() TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_future_invoices(BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.preview_future_invoices() IS 'Lists invoices whose billing period starts after the current calendar month.';
COMMENT ON FUNCTION public.void_future_invoices(BOOLEAN) IS 'Voids future-month invoices. Pass FALSE to apply; default TRUE is preview only.';

-- One-time cleanup when this migration is applied.
DO $$
DECLARE
  v_result JSONB;
BEGIN
  v_result := public.void_future_invoices(FALSE);
  RAISE NOTICE 'Future invoice cleanup: %', v_result;
END $$;
