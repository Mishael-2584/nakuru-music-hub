-- Replace get_student_payment_summary with account_credit column (requires DROP; 42P13 on CREATE OR REPLACE).

DROP FUNCTION IF EXISTS public.get_student_payment_summary(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_student_payment_summary(uuid) CASCADE;

CREATE FUNCTION public.get_student_payment_summary(student_id_param UUID)
RETURNS TABLE (
  total_invoiced DECIMAL(10,2),
  total_paid DECIMAL(10,2),
  outstanding_balance DECIMAL(10,2),
  paid_invoices_count INTEGER,
  pending_invoices_count INTEGER,
  overdue_invoices_count INTEGER,
  account_credit DECIMAL(10,2)
) AS $$
BEGIN
  IF NOT (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
    OR student_id_param IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(public.get_invoice_effective_due(i.id)), 0)::DECIMAL(10,2) AS total_invoiced,
    COALESCE(SUM(i.amount_paid), 0)::DECIMAL(10,2) AS total_paid,
    COALESCE(SUM(GREATEST(0, public.get_invoice_effective_due(i.id) - COALESCE(i.amount_paid, 0))), 0)::DECIMAL(10,2) AS outstanding_balance,
    COUNT(CASE WHEN i.payment_status = 'paid' THEN 1 END)::INTEGER AS paid_invoices_count,
    COUNT(CASE WHEN i.payment_status IN ('pending', 'partial') THEN 1 END)::INTEGER AS pending_invoices_count,
    COUNT(CASE WHEN i.payment_status = 'overdue' OR (i.due_date < CURRENT_DATE AND i.payment_status != 'paid') THEN 1 END)::INTEGER AS overdue_invoices_count,
    public.get_student_credit_balance(student_id_param)::DECIMAL(10,2) AS account_credit
  FROM public.invoices i
  WHERE i.student_id = student_id_param;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_student_payment_summary(UUID) TO authenticated, service_role;
