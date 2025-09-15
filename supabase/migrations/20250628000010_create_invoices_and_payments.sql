-- Migration: Add missing columns to existing invoices table and enhance payments table

-- 1. Add missing columns to existing invoices table (only if they don't exist)
DO $$
BEGIN
  -- Add fee_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'fee_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN fee_id UUID REFERENCES public.fees(id) ON DELETE SET NULL;
  END IF;

  -- Add registration_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'registration_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL;
  END IF;

  -- Add is_auto_generated column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'is_auto_generated'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN is_auto_generated BOOLEAN DEFAULT true;
  END IF;

  -- Add admin_override column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'admin_override'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN admin_override BOOLEAN DEFAULT false;
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN notes TEXT;
  END IF;

  -- Add sessions_per_week column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'sessions_per_week'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN sessions_per_week INTEGER DEFAULT 1;
  END IF;
END $$;

-- 2. Add missing columns to existing payments table (only if they don't exist)
DO $$
BEGIN
  -- Add invoice_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;
  END IF;

  -- Add mpesa_transaction_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'mpesa_transaction_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN mpesa_transaction_id TEXT;
  END IF;

  -- Add payer_phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'payer_phone'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN payer_phone TEXT;
  END IF;

  -- Add raw_callback_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'raw_callback_data'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN raw_callback_data JSONB;
  END IF;
END $$;

-- 3. Create indexes (conditional on columns existing)
DO $$
BEGIN
  -- fee_id index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'fee_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_fee_id ON public.invoices(fee_id);
  END IF;

  -- registration_id index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'registration_id'
  ) THEN
CREATE INDEX IF NOT EXISTS idx_invoices_registration_id ON public.invoices(registration_id);
  END IF;

  -- invoice_id index for payments
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'invoice_id'
  ) THEN
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
  END IF;
END $$; 