-- Partial payments ledger, student credit wallet, and unified invoice payment status

-- ============================================
-- 0. Ensure invoice override columns exist (prod may be missing these)
-- Must run before any function/trigger references them.
-- ============================================
DO $ensure_cols$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'manual_amount_due'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN manual_amount_due NUMERIC(12,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'manual_amount_override'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN manual_amount_override DECIMAL(10,2);
  END IF;
END;
$ensure_cols$;

-- ============================================
-- 0b. Ensure student + invoice payment columns exist (prod may have missed older migrations)
-- ============================================
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS account_suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS first_invoice_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS first_invoice_paid_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS can_book_classes BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS account_notes TEXT;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- ============================================
-- 1. Payment columns for audit trail
-- ============================================
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(12,2);

COMMENT ON COLUMN public.payments.recorded_by IS 'Admin who recorded this payment';
COMMENT ON COLUMN public.payments.credit_amount IS 'Portion of payment applied from student credit wallet';
COMMENT ON COLUMN public.payments.cash_amount IS 'Cash received for this payment transaction';

-- ============================================
-- 2. Student credit ledger (append-only)
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('overpayment', 'manual_adjustment', 'applied_to_invoice')),
  source_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  applied_invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_credit_ledger_student ON public.student_credit_ledger(student_id, created_at DESC);

ALTER TABLE public.student_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage student credit ledger" ON public.student_credit_ledger;
CREATE POLICY "Admins manage student credit ledger" ON public.student_credit_ledger
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Students view own credit ledger" ON public.student_credit_ledger;
CREATE POLICY "Students view own credit ledger" ON public.student_credit_ledger
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- ============================================
-- 3. Effective invoice amount helper
-- ============================================
CREATE OR REPLACE FUNCTION public.get_invoice_effective_due(p_invoice_id UUID)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_row JSONB;
BEGIN
  SELECT to_jsonb(i) INTO v_row
  FROM public.invoices i
  WHERE i.id = p_invoice_id;

  IF v_row IS NULL THEN
    RETURN 0;
  END IF;

  RETURN COALESCE(
    NULLIF(v_row->>'manual_amount_due', '')::NUMERIC(12,2),
    NULLIF(v_row->>'manual_amount_override', '')::NUMERIC(12,2),
    NULLIF(v_row->>'amount_due', '')::NUMERIC(12,2),
    0
  );
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.get_invoice_effective_due(UUID) TO authenticated, service_role;

-- ============================================
-- 4. Student credit balance
-- ============================================
CREATE OR REPLACE FUNCTION public.get_student_credit_balance(p_student_id UUID)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_balance NUMERIC(12,2);
BEGIN
  IF NOT (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    OR p_student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM public.student_credit_ledger
  WHERE student_id = p_student_id;

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_student_credit_balance(UUID) TO authenticated, service_role;

-- ============================================
-- 5. Sync invoice totals from payments
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_invoice_payment_totals(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
  v_effective_due NUMERIC(12,2);
  v_total_paid NUMERIC(12,2);
  v_new_payment_status TEXT;
  v_old RECORD;
BEGIN
  SELECT * INTO v_old FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_effective_due := public.get_invoice_effective_due(p_invoice_id);

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = p_invoice_id AND status = 'completed';

  v_new_payment_status := CASE
    WHEN v_total_paid >= v_effective_due AND v_effective_due > 0 THEN 'paid'
    WHEN v_total_paid > 0 THEN 'partial'
    ELSE 'pending'
  END;

  UPDATE public.invoices
  SET
    amount_paid = v_total_paid,
    payment_status = v_new_payment_status,
    status = CASE
      WHEN v_new_payment_status = 'paid' THEN 'paid'
      WHEN v_new_payment_status = 'partial' THEN COALESCE(NULLIF(status, 'paid'), 'sent')
      ELSE status
    END,
    paid_date = CASE
      WHEN v_new_payment_status = 'paid' THEN COALESCE(paid_date, NOW())
      WHEN v_new_payment_status != 'paid' THEN NULL
      ELSE paid_date
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Payment trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'payments' AND NEW.invoice_id IS NOT NULL THEN
    PERFORM public.sync_invoice_payment_totals(NEW.invoice_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_invoice_payment_status_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.invoice_id IS NOT NULL THEN
    PERFORM public.sync_invoice_payment_totals(OLD.invoice_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON public.payments;
CREATE TRIGGER trigger_update_invoice_payment_status
  AFTER INSERT OR UPDATE OF amount, status, invoice_id ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_payment_status();

DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status_delete ON public.payments;
CREATE TRIGGER trigger_update_invoice_payment_status_delete
  AFTER DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_payment_status_on_delete();

-- Re-sync totals when admin changes amount due / manual override
CREATE OR REPLACE FUNCTION public.sync_invoice_on_amount_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.amount_due IS DISTINCT FROM NEW.amount_due
     OR COALESCE(to_jsonb(OLD)->>'manual_amount_due', '') IS DISTINCT FROM COALESCE(to_jsonb(NEW)->>'manual_amount_due', '')
     OR COALESCE(to_jsonb(OLD)->>'manual_amount_override', '') IS DISTINCT FROM COALESCE(to_jsonb(NEW)->>'manual_amount_override', '') THEN
    PERFORM public.sync_invoice_payment_totals(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_invoice_on_amount_change ON public.invoices;
DROP TRIGGER IF EXISTS trigger_sync_invoice_on_due_change ON public.invoices;

DO $trigger$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invoices'
      AND column_name = 'manual_amount_override'
  ) THEN
    EXECUTE $sql$
      CREATE TRIGGER trigger_sync_invoice_on_amount_change
        AFTER UPDATE OF amount_due, manual_amount_due, manual_amount_override ON public.invoices
        FOR EACH ROW
        EXECUTE FUNCTION public.sync_invoice_on_amount_change()
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE TRIGGER trigger_sync_invoice_on_amount_change
        AFTER UPDATE OF amount_due, manual_amount_due ON public.invoices
        FOR EACH ROW
        EXECUTE FUNCTION public.sync_invoice_on_amount_change()
    $sql$;
  END IF;
END;
$trigger$;

-- ============================================
-- 7. First invoice paid gate (use payment_status)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_first_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    IF NEW.id = (
      SELECT i.id FROM public.invoices i
      WHERE i.student_id = NEW.student_id
      ORDER BY i.period_start ASC NULLS LAST, i.created_at ASC
      LIMIT 1
    ) THEN
      UPDATE public.students
      SET
        first_invoice_paid = TRUE,
        first_invoice_paid_date = COALESCE(NEW.paid_date, NOW()),
        can_book_classes = TRUE,
        updated_at = NOW()
      WHERE id = NEW.student_id
        AND account_suspended = FALSE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_first_invoice_payment ON public.invoices;
CREATE TRIGGER trigger_update_first_invoice_payment
  AFTER UPDATE OF status, payment_status ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_first_invoice_payment_status();

-- ============================================
-- 8. Record invoice payment RPC (admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id UUID,
  p_cash_amount NUMERIC(12,2) DEFAULT 0,
  p_credit_amount NUMERIC(12,2) DEFAULT 0,
  p_payment_method TEXT DEFAULT 'cash',
  p_mpesa_transaction_id TEXT DEFAULT NULL,
  p_payer_phone TEXT DEFAULT NULL,
  p_paid_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_effective_due NUMERIC(12,2);
  v_balance NUMERIC(12,2);
  v_credit_balance NUMERIC(12,2);
  v_total_in NUMERIC(12,2);
  v_applied NUMERIC(12,2);
  v_overpayment NUMERIC(12,2);
  v_credit_used NUMERIC(12,2);
  v_cash_applied NUMERIC(12,2);
  v_payment_id UUID;
  v_was_paid BOOLEAN;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  v_was_paid := v_invoice.payment_status = 'paid';
  v_effective_due := public.get_invoice_effective_due(p_invoice_id);
  v_balance := GREATEST(0, v_effective_due - COALESCE(v_invoice.amount_paid, 0));
  v_credit_balance := public.get_student_credit_balance(v_invoice.student_id);
  v_total_in := COALESCE(p_cash_amount, 0) + COALESCE(p_credit_amount, 0);

  IF v_total_in <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF COALESCE(p_credit_amount, 0) > v_credit_balance THEN
    RAISE EXCEPTION 'Insufficient account credit (available: %)', v_credit_balance;
  END IF;

  v_applied := LEAST(v_total_in, v_balance);
  IF v_balance = 0 AND v_total_in > 0 THEN
    -- Invoice already fully paid; entire amount becomes credit
    v_applied := 0;
    v_overpayment := v_total_in;
    v_credit_used := 0;
    v_cash_applied := 0;
  ELSE
    v_overpayment := GREATEST(0, v_total_in - v_applied);
    v_credit_used := LEAST(COALESCE(p_credit_amount, 0), v_applied);
    v_cash_applied := v_applied - v_credit_used;
  END IF;

  IF v_applied > 0 THEN
    INSERT INTO public.payments (
      student_id, invoice_id, amount, cash_amount, credit_amount,
      payment_method, status, paid_date, mpesa_transaction_id, payer_phone,
      notes, recorded_by, payment_type
    ) VALUES (
      v_invoice.student_id, p_invoice_id, v_applied, v_cash_applied, v_credit_used,
      COALESCE(p_payment_method, 'cash'), 'completed', p_paid_date, p_mpesa_transaction_id, p_payer_phone,
      p_notes, COALESCE(p_recorded_by, auth.uid()), 'tuition'
    )
    RETURNING id INTO v_payment_id;

    IF v_credit_used > 0 THEN
      INSERT INTO public.student_credit_ledger (
        student_id, amount, source_type, source_payment_id, applied_invoice_id, notes, created_by
      ) VALUES (
        v_invoice.student_id, -v_credit_used, 'applied_to_invoice', v_payment_id, p_invoice_id,
        COALESCE(p_notes, 'Credit applied to invoice'), COALESCE(p_recorded_by, auth.uid())
      );
    END IF;
  ELSE
    v_payment_id := NULL;
  END IF;

  IF v_overpayment > 0 THEN
    INSERT INTO public.student_credit_ledger (
      student_id, amount, source_type, source_payment_id, applied_invoice_id, notes, created_by
    ) VALUES (
      v_invoice.student_id, v_overpayment, 'overpayment', v_payment_id, p_invoice_id,
      COALESCE(p_notes, 'Overpayment credited to account'), COALESCE(p_recorded_by, auth.uid())
    );
  END IF;

  PERFORM public.sync_invoice_payment_totals(p_invoice_id);

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'invoice_id', p_invoice_id,
    'applied_to_invoice', v_applied,
    'overpayment_credit', v_overpayment,
    'credit_used', v_credit_used,
    'cash_applied', v_cash_applied,
    'balance_remaining', GREATEST(0, v_effective_due - COALESCE(v_invoice.amount_paid, 0)),
    'payment_status', v_invoice.payment_status,
    'amount_paid', v_invoice.amount_paid,
    'effective_due', v_effective_due,
    'student_credit_balance', public.get_student_credit_balance(v_invoice.student_id),
    'became_paid', (NOT v_was_paid AND v_invoice.payment_status = 'paid'),
    'student_id', v_invoice.student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_invoice_payment(
  UUID, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, DATE, TEXT, UUID
) TO authenticated, service_role;

-- Section 9 (get_student_payment_summary) moved to 20260523000003 — cannot change RETURNS TABLE via CREATE OR REPLACE.

-- ============================================
-- 10. Refresh sync helper for manual overrides
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_payments_with_invoices()
RETURNS void AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN SELECT id FROM public.invoices LOOP
    PERFORM public.sync_invoice_payment_totals(inv.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Section 11 (legacy payment backfill) moved to 20260523000004_backfill_legacy_payments.sql
-- so schema/triggers apply cleanly before bulk inserts run.
