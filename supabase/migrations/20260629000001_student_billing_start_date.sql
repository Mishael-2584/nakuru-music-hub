-- Anchor tuition billing to the month lessons actually begin (set on first payment alignment).

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS billing_start_date DATE;

COMMENT ON COLUMN public.students.billing_start_date IS
  'First calendar month when recurring tuition billing applies. Set when the first payment is recorded and earlier unused invoices are voided.';

CREATE INDEX IF NOT EXISTS idx_students_billing_start_date ON public.students(billing_start_date);
