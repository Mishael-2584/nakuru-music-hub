-- invoices.status only allows: pending, paid, overdue, cancelled
-- sync_invoice_payment_totals incorrectly used 'sent' for partial payments.

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
      WHEN v_new_payment_status = 'partial' THEN COALESCE(NULLIF(status, 'paid'), 'pending')
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
