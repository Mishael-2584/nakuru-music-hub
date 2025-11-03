-- Add manual override fields for invoices and update payment status logic

-- 1. Add manual override metadata columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS manual_amount_due NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS manual_balance_note TEXT,
  ADD COLUMN IF NOT EXISTS manual_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manual_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.invoices.manual_amount_due IS 'Optional admin override for the amount due that is shown to students';
COMMENT ON COLUMN public.invoices.manual_balance_note IS 'Admin-visible note explaining a manual balance adjustment';
COMMENT ON COLUMN public.invoices.manual_updated_at IS 'Timestamp for the most recent manual override change';
COMMENT ON COLUMN public.invoices.manual_updated_by IS 'Profile ID of the admin who last modified the manual override fields';

-- 2. Ensure admin_override defaults to FALSE
ALTER TABLE public.invoices
  ALTER COLUMN admin_override SET DEFAULT FALSE;

-- 3. Refresh the invoice payment status trigger to respect manual overrides
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record RECORD;
    total_paid DECIMAL(12,2);
    effective_due DECIMAL(12,2);
BEGIN
    IF TG_TABLE_NAME = 'payments' THEN
        SELECT *, COALESCE(manual_amount_due, amount_due) AS effective_due
        INTO invoice_record
        FROM public.invoices
        WHERE id = NEW.invoice_id;

        IF FOUND THEN
            SELECT COALESCE(SUM(amount), 0) INTO total_paid
            FROM public.payments
            WHERE invoice_id = NEW.invoice_id
              AND status = 'completed';

            effective_due := COALESCE(invoice_record.manual_amount_due, invoice_record.amount_due);

            UPDATE public.invoices
            SET amount_paid = total_paid,
                payment_status = CASE
                    WHEN total_paid >= effective_due THEN 'paid'
                    WHEN total_paid > 0 THEN 'partial'
                    ELSE 'pending'
                END,
                updated_at = NOW()
            WHERE id = NEW.invoice_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Refresh the sync function so manual overrides are respected when reconciling data
CREATE OR REPLACE FUNCTION sync_payments_with_invoices()
RETURNS void AS $$
DECLARE
    payment_record RECORD;
    invoice_record RECORD;
    total_paid DECIMAL(12,2);
    effective_due DECIMAL(12,2);
BEGIN
    -- Link orphaned payments to invoices based on student and period
    FOR payment_record IN
        SELECT * FROM public.payments
        WHERE invoice_id IS NULL
    LOOP
        SELECT * INTO invoice_record
        FROM public.invoices
        WHERE student_id = payment_record.student_id
          AND payment_record.paid_date BETWEEN period_start AND period_end
        LIMIT 1;

        IF FOUND THEN
            UPDATE public.payments
            SET invoice_id = invoice_record.id
            WHERE id = payment_record.id;
        END IF;
    END LOOP;

    -- Recalculate payment status for all invoices using manual overrides where present
    FOR invoice_record IN
        SELECT * FROM public.invoices
    LOOP
        effective_due := COALESCE(invoice_record.manual_amount_due, invoice_record.amount_due);

        SELECT COALESCE(SUM(amount), 0)
        INTO total_paid
        FROM public.payments
        WHERE invoice_id = invoice_record.id
          AND status = 'completed';

        UPDATE public.invoices
        SET amount_paid = total_paid,
            payment_status = CASE
                WHEN total_paid >= effective_due THEN 'paid'
                WHEN total_paid > 0 THEN 'partial'
                ELSE 'pending'
            END
        WHERE id = invoice_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Ensure latest trigger definition is active
DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON public.payments;
CREATE TRIGGER trigger_update_invoice_payment_status
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();


