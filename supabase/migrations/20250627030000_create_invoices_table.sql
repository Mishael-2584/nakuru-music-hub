-- Migration: Create invoices table for student lesson billing
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  lessons_summary JSONB,
  amount_due DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup by student and period
CREATE INDEX IF NOT EXISTS idx_invoices_student_period ON public.invoices(student_id, period_start, period_end);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own invoices
CREATE POLICY "Students can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.students WHERE id = student_id));

-- Policy: Admins can manage all invoices
CREATE POLICY "Admins can manage all invoices" ON public.invoices
  FOR ALL USING (auth.role() = 'authenticated'); 