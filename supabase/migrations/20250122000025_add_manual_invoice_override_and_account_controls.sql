-- Add manual override capabilities for invoices and student account controls
-- This migration enables admins to:
-- 1. Manually override invoice amounts and balances
-- 2. Suspend/activate student accounts
-- 3. Track first invoice payment status
-- 4. Enforce payment restrictions on class bookings

-- ============================================
-- PART 1: Enhance invoices table with manual overrides
-- ============================================

-- Add manual override columns to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS manual_amount_override DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_balance DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS override_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add computed column to get effective amount (manual override takes precedence)
COMMENT ON COLUMN public.invoices.manual_amount_override IS 'Manual override for invoice amount. If set, this value takes precedence over amount_due';
COMMENT ON COLUMN public.invoices.manual_balance IS 'Manual balance adjustment for student account. Positive = student owes, Negative = student credit';
COMMENT ON COLUMN public.invoices.override_reason IS 'Admin reason for manual override (e.g., "Partial month adjustment", "Discount applied")';

-- Create index for manual overrides tracking
CREATE INDEX IF NOT EXISTS idx_invoices_manual_override ON public.invoices(overridden_by, overridden_at) WHERE manual_amount_override IS NOT NULL;

-- ============================================
-- PART 2: Enhance students table with account controls
-- ============================================

-- Add account control columns to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS account_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS first_invoice_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS first_invoice_paid_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS can_book_classes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS account_notes TEXT DEFAULT NULL;

-- Add indexes for account status queries
CREATE INDEX IF NOT EXISTS idx_students_account_suspended ON public.students(account_suspended);
CREATE INDEX IF NOT EXISTS idx_students_first_invoice_paid ON public.students(first_invoice_paid);
CREATE INDEX IF NOT EXISTS idx_students_can_book_classes ON public.students(can_book_classes);

-- Add comments for clarity
COMMENT ON COLUMN public.students.account_suspended IS 'Admin can manually suspend student account, blocking all access';
COMMENT ON COLUMN public.students.first_invoice_paid IS 'Automatically set to true when first invoice is marked paid. Required before booking classes.';
COMMENT ON COLUMN public.students.can_book_classes IS 'Controls whether student can book classes. Auto-enabled after first invoice paid unless suspended.';
COMMENT ON COLUMN public.students.account_notes IS 'Admin notes about account status, restrictions, or special arrangements';

-- ============================================
-- PART 3: Create function to auto-update first invoice status
-- ============================================

CREATE OR REPLACE FUNCTION update_first_invoice_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When an invoice is marked as paid, check if it's the student's first invoice
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Check if this is the first invoice (earliest period_start)
    IF EXISTS (
      SELECT 1 FROM public.invoices
      WHERE student_id = NEW.student_id
        AND period_start <= NEW.period_start
        AND id = NEW.id
      ORDER BY period_start ASC
      LIMIT 1
    ) THEN
      -- This is the first invoice, update student record
      UPDATE public.students
      SET 
        first_invoice_paid = TRUE,
        first_invoice_paid_date = NEW.paid_date,
        can_book_classes = TRUE,
        updated_at = NOW()
      WHERE id = NEW.student_id
        AND account_suspended = FALSE; -- Only enable if not suspended
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-updating first invoice status
DROP TRIGGER IF EXISTS trigger_update_first_invoice_payment ON public.invoices;
CREATE TRIGGER trigger_update_first_invoice_payment
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_first_invoice_payment_status();

-- ============================================
-- PART 4: Create function to handle account suspension
-- ============================================

CREATE OR REPLACE FUNCTION suspend_student_account(
  p_student_id UUID,
  p_reason TEXT,
  p_suspended_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.students
  SET 
    account_suspended = TRUE,
    suspension_reason = p_reason,
    suspended_by = p_suspended_by,
    suspended_at = NOW(),
    can_book_classes = FALSE,
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Create function to reactivate account
-- ============================================

CREATE OR REPLACE FUNCTION activate_student_account(
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_first_invoice_paid BOOLEAN;
BEGIN
  -- Get first invoice paid status
  SELECT first_invoice_paid INTO v_first_invoice_paid
  FROM public.students
  WHERE id = p_student_id;
  
  -- Reactivate account
  UPDATE public.students
  SET 
    account_suspended = FALSE,
    suspension_reason = NULL,
    suspended_by = NULL,
    suspended_at = NULL,
    can_book_classes = v_first_invoice_paid, -- Only enable booking if first invoice paid
    updated_at = NOW()
  WHERE id = p_student_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Create function to get effective invoice amount
-- ============================================

CREATE OR REPLACE FUNCTION get_effective_invoice_amount(
  p_invoice_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_amount DECIMAL;
  v_manual_override DECIMAL;
BEGIN
  SELECT amount_due, manual_amount_override 
  INTO v_amount, v_manual_override
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  -- Return manual override if set, otherwise return original amount
  RETURN COALESCE(v_manual_override, v_amount);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: Grant permissions
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_first_invoice_payment_status() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION suspend_student_account(UUID, TEXT, UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION activate_student_account(UUID) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_effective_invoice_amount(UUID) TO service_role, authenticated, anon;

-- Grant admin permissions on new columns
GRANT UPDATE (manual_amount_override, manual_balance, override_reason, overridden_by, overridden_at) ON public.invoices TO authenticated;
GRANT UPDATE (account_suspended, suspension_reason, suspended_by, suspended_at, first_invoice_paid, can_book_classes, account_notes) ON public.students TO authenticated;

-- ============================================
-- PART 8: Update existing students
-- ============================================

-- For existing students, check if they have a paid invoice and update first_invoice_paid accordingly
UPDATE public.students s
SET 
  first_invoice_paid = TRUE,
  can_book_classes = TRUE,
  first_invoice_paid_date = (
    SELECT MIN(i.paid_date)
    FROM public.invoices i
    WHERE i.student_id = s.id AND i.status = 'paid'
  )
WHERE EXISTS (
  SELECT 1 FROM public.invoices i
  WHERE i.student_id = s.id AND i.status = 'paid'
);

-- ============================================
-- PART 9: Add helpful views for admin
-- ============================================

-- View for students requiring first invoice payment
CREATE OR REPLACE VIEW students_pending_first_payment AS
SELECT 
  s.id,
  s.student_name,
  s.email,
  s.phone,
  s.course_category,
  s.instrument,
  s.created_at,
  i.id as first_invoice_id,
  i.amount_due,
  i.manual_amount_override,
  COALESCE(i.manual_amount_override, i.amount_due) as effective_amount,
  i.status as invoice_status,
  i.due_date
FROM public.students s
LEFT JOIN LATERAL (
  SELECT * FROM public.invoices
  WHERE student_id = s.id
  ORDER BY period_start ASC
  LIMIT 1
) i ON true
WHERE s.first_invoice_paid = FALSE
  AND s.account_suspended = FALSE
ORDER BY s.created_at DESC;

GRANT SELECT ON students_pending_first_payment TO authenticated;

-- View for suspended students
CREATE OR REPLACE VIEW suspended_students AS
SELECT 
  s.id,
  s.student_name,
  s.email,
  s.phone,
  s.account_suspended,
  s.suspension_reason,
  s.suspended_at,
  s.account_notes,
  p.email as suspended_by_email
FROM public.students s
LEFT JOIN public.profiles p ON p.id = s.suspended_by
WHERE s.account_suspended = TRUE
ORDER BY s.suspended_at DESC;

GRANT SELECT ON suspended_students TO authenticated;

