-- Backfill payment rows for invoices marked paid before the partial-payments ledger existed.
-- Runs after 20260523000001 so student columns and triggers are in place.

ALTER TABLE public.invoices DISABLE TRIGGER trigger_update_first_invoice_payment;

INSERT INTO public.payments (
  student_id, invoice_id, amount, cash_amount, credit_amount,
  payment_method, status, paid_date, notes, payment_type
)
SELECT
  i.student_id,
  i.id,
  public.get_invoice_effective_due(i.id),
  public.get_invoice_effective_due(i.id),
  0,
  'cash',
  'completed',
  COALESCE(i.paid_date::DATE, i.updated_at::DATE, CURRENT_DATE),
  'Migrated from legacy mark-as-paid',
  'tuition'
FROM public.invoices i
WHERE i.status = 'paid'
  AND COALESCE(i.amount_paid, 0) = 0
  AND NOT EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.invoice_id = i.id AND p.status = 'completed'
  );

SELECT public.sync_payments_with_invoices();

ALTER TABLE public.invoices ENABLE TRIGGER trigger_update_first_invoice_payment;

-- Sync first_invoice_paid for students whose earliest invoice is fully paid
UPDATE public.students s
SET
  first_invoice_paid = TRUE,
  first_invoice_paid_date = COALESCE(s.first_invoice_paid_date, sub.paid_date, NOW()),
  can_book_classes = CASE
    WHEN COALESCE(s.account_suspended, FALSE) THEN FALSE
    ELSE TRUE
  END,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (i.student_id)
    i.student_id,
    i.paid_date
  FROM public.invoices i
  WHERE i.payment_status = 'paid'
  ORDER BY i.student_id, i.period_start ASC NULLS LAST, i.created_at ASC
) sub
WHERE s.id = sub.student_id
  AND COALESCE(s.first_invoice_paid, FALSE) = FALSE;
