-- PayNexus M-Pesa STK: pending payment attempts + gateway recording path

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  phone TEXT NOT NULL,
  description TEXT,
  paynexus_reference TEXT,
  checkout_request_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
  failure_reason TEXT,
  mpesa_transaction_id TEXT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  raw_response JSONB,
  raw_webhook JSONB,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_paynexus_reference_unique
  ON public.payment_attempts (paynexus_reference)
  WHERE paynexus_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_checkout_request_id_unique
  ON public.payment_attempts (checkout_request_id)
  WHERE checkout_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempts_mpesa_tx_unique
  ON public.payment_attempts (mpesa_transaction_id)
  WHERE mpesa_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_attempts_invoice_id ON public.payment_attempts (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_student_id ON public.payment_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts (status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.payments
    WHERE mpesa_transaction_id IS NOT NULL
      AND btrim(mpesa_transaction_id) <> ''
    GROUP BY mpesa_transaction_id
    HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mpesa_transaction_id_unique
      ON public.payments (mpesa_transaction_id)
      WHERE mpesa_transaction_id IS NOT NULL AND btrim(mpesa_transaction_id) <> '';
  END IF;
END $$;

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own payment attempts" ON public.payment_attempts;
CREATE POLICY "Students can view own payment attempts"
  ON public.payment_attempts
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can view all payment attempts" ON public.payment_attempts;
CREATE POLICY "Admins can view all payment attempts"
  ON public.payment_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

GRANT SELECT ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;

CREATE OR REPLACE FUNCTION public.set_payment_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_attempts_updated_at ON public.payment_attempts;
CREATE TRIGGER trg_payment_attempts_updated_at
  BEFORE UPDATE ON public.payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_attempts_updated_at();

-- Gateway path: same ledger rules as record_invoice_payment, callable only by service_role.
CREATE OR REPLACE FUNCTION public.record_gateway_invoice_payment(
  p_invoice_id UUID,
  p_cash_amount NUMERIC(12,2),
  p_payment_method TEXT DEFAULT 'mpesa',
  p_mpesa_transaction_id TEXT DEFAULT NULL,
  p_payer_phone TEXT DEFAULT NULL,
  p_paid_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL,
  p_raw_callback_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_effective_due NUMERIC(12,2);
  v_balance NUMERIC(12,2);
  v_applied NUMERIC(12,2);
  v_overpayment NUMERIC(12,2);
  v_payment_id UUID;
  v_was_paid BOOLEAN;
  v_existing_id UUID;
BEGIN
  -- Executable only by service_role (see GRANT below).

  IF COALESCE(p_cash_amount, 0) <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_mpesa_transaction_id IS NOT NULL AND btrim(p_mpesa_transaction_id) <> '' THEN
    SELECT id INTO v_existing_id
    FROM public.payments
    WHERE mpesa_transaction_id = p_mpesa_transaction_id
    LIMIT 1;

    IF FOUND THEN
      SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
      RETURN jsonb_build_object(
        'payment_id', v_existing_id,
        'invoice_id', p_invoice_id,
        'applied_to_invoice', 0,
        'overpayment_credit', 0,
        'credit_used', 0,
        'cash_applied', 0,
        'balance_remaining', GREATEST(0, public.get_invoice_effective_due(p_invoice_id) - COALESCE(v_invoice.amount_paid, 0)),
        'payment_status', v_invoice.payment_status,
        'amount_paid', v_invoice.amount_paid,
        'effective_due', public.get_invoice_effective_due(p_invoice_id),
        'student_credit_balance', public.get_student_credit_balance(v_invoice.student_id),
        'became_paid', FALSE,
        'student_id', v_invoice.student_id,
        'duplicate', TRUE
      );
    END IF;
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record payment on a cancelled invoice';
  END IF;

  v_was_paid := v_invoice.payment_status = 'paid';
  v_effective_due := public.get_invoice_effective_due(p_invoice_id);
  v_balance := GREATEST(0, v_effective_due - COALESCE(v_invoice.amount_paid, 0));

  IF v_balance = 0 THEN
    INSERT INTO public.student_credit_ledger (
      student_id, amount, source_type, source_payment_id, applied_invoice_id, notes, created_by
    ) VALUES (
      v_invoice.student_id, p_cash_amount, 'overpayment', NULL, p_invoice_id,
      COALESCE(p_notes, 'Gateway overpayment credited to account'), NULL
    );

    RETURN jsonb_build_object(
      'payment_id', NULL,
      'invoice_id', p_invoice_id,
      'applied_to_invoice', 0,
      'overpayment_credit', p_cash_amount,
      'credit_used', 0,
      'cash_applied', 0,
      'balance_remaining', 0,
      'payment_status', v_invoice.payment_status,
      'amount_paid', v_invoice.amount_paid,
      'effective_due', v_effective_due,
      'student_credit_balance', public.get_student_credit_balance(v_invoice.student_id),
      'became_paid', FALSE,
      'student_id', v_invoice.student_id,
      'duplicate', FALSE
    );
  END IF;

  v_applied := LEAST(p_cash_amount, v_balance);
  v_overpayment := GREATEST(0, p_cash_amount - v_applied);

  INSERT INTO public.payments (
    student_id, invoice_id, amount, cash_amount, credit_amount,
    payment_method, status, paid_date, mpesa_transaction_id, payer_phone,
    notes, recorded_by, payment_type, raw_callback_data
  ) VALUES (
    v_invoice.student_id, p_invoice_id, v_applied, v_applied, 0,
    COALESCE(p_payment_method, 'mpesa'), 'completed', p_paid_date, p_mpesa_transaction_id, p_payer_phone,
    p_notes, NULL, 'tuition', p_raw_callback_data
  )
  RETURNING id INTO v_payment_id;

  IF v_overpayment > 0 THEN
    INSERT INTO public.student_credit_ledger (
      student_id, amount, source_type, source_payment_id, applied_invoice_id, notes, created_by
    ) VALUES (
      v_invoice.student_id, v_overpayment, 'overpayment', v_payment_id, p_invoice_id,
      COALESCE(p_notes, 'Gateway overpayment credited to account'), NULL
    );
  END IF;

  PERFORM public.sync_invoice_payment_totals(p_invoice_id);
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'invoice_id', p_invoice_id,
    'applied_to_invoice', v_applied,
    'overpayment_credit', v_overpayment,
    'credit_used', 0,
    'cash_applied', v_applied,
    'balance_remaining', GREATEST(0, v_effective_due - COALESCE(v_invoice.amount_paid, 0)),
    'payment_status', v_invoice.payment_status,
    'amount_paid', v_invoice.amount_paid,
    'effective_due', v_effective_due,
    'student_credit_balance', public.get_student_credit_balance(v_invoice.student_id),
    'became_paid', (NOT v_was_paid AND v_invoice.payment_status = 'paid'),
    'student_id', v_invoice.student_id,
    'duplicate', FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.record_gateway_invoice_payment(
  UUID, NUMERIC, TEXT, TEXT, TEXT, DATE, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_gateway_invoice_payment(
  UUID, NUMERIC, TEXT, TEXT, TEXT, DATE, TEXT, JSONB
) TO service_role;

COMMENT ON TABLE public.payment_attempts IS 'PayNexus STK Push attempts linked to academy invoices.';
COMMENT ON FUNCTION public.record_gateway_invoice_payment IS 'Service-role only: record M-Pesa/gateway payment onto invoice ledger with idempotency.';
