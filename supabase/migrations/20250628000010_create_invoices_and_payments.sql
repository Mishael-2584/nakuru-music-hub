-- Migration: Create invoices and payments tables for flexible billing and MPESA integration

-- 1. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  fee_id UUID REFERENCES public.fees(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'void')),
  is_auto_generated BOOLEAN DEFAULT true,
  admin_override BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  mpesa_transaction_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  payer_phone TEXT,
  raw_callback_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_registration_id ON public.invoices(registration_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fee_id ON public.invoices(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Example RLS policies (customize as needed)
-- Allow students to view their own invoices
CREATE POLICY "Students can view own invoices" ON public.invoices
  FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Allow students to view their own payments
CREATE POLICY "Students can view own payments" ON public.payments
  FOR SELECT USING (invoice_id IN (SELECT id FROM public.invoices WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())));

-- Allow admins to manage all invoices and payments
CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))); 