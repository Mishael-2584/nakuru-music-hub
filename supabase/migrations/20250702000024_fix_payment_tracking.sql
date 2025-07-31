-- Migration: Fix payment tracking and invoice status updates
-- This migration ensures payments are properly linked to invoices and updates invoice status when payments are made

-- Add invoice_id column to payments table if it doesn't exist
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id);

-- Add payment_status column to invoices table if it doesn't exist
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

-- Add amount_paid column to invoices table if it doesn't exist
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0.00;

-- Create function to update invoice payment status when payments are made
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record RECORD;
    total_paid DECIMAL(10,2);
BEGIN
    -- If this is a payment being inserted/updated
    IF TG_TABLE_NAME = 'payments' THEN
        -- Get the invoice record
        SELECT * INTO invoice_record 
        FROM public.invoices 
        WHERE id = NEW.invoice_id;
        
        IF FOUND THEN
            -- Calculate total paid for this invoice
            SELECT COALESCE(SUM(amount), 0) INTO total_paid
            FROM public.payments 
            WHERE invoice_id = NEW.invoice_id 
            AND status = 'completed';
            
            -- Update invoice payment status
            UPDATE public.invoices 
            SET 
                amount_paid = total_paid,
                payment_status = CASE 
                    WHEN total_paid >= amount_due THEN 'paid'
                    WHEN total_paid > 0 THEN 'partial'
                    ELSE 'pending'
                END
            WHERE id = NEW.invoice_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update invoice payment status
DROP TRIGGER IF EXISTS trigger_update_invoice_payment_status ON public.payments;
CREATE TRIGGER trigger_update_invoice_payment_status
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_payment_status();

-- Create function to sync existing payments with invoices
CREATE OR REPLACE FUNCTION sync_payments_with_invoices()
RETURNS void AS $$
DECLARE
    payment_record RECORD;
    invoice_record RECORD;
BEGIN
    -- For each payment, try to find a matching invoice
    FOR payment_record IN 
        SELECT * FROM public.payments 
        WHERE invoice_id IS NULL
    LOOP
        -- Try to find invoice by student_id and payment date
        SELECT * INTO invoice_record 
        FROM public.invoices 
        WHERE student_id = payment_record.student_id
        AND payment_record.paid_date BETWEEN period_start AND period_end
        LIMIT 1;
        
        IF FOUND THEN
            -- Update payment with invoice_id
            UPDATE public.payments 
            SET invoice_id = invoice_record.id
            WHERE id = payment_record.id;
        END IF;
    END LOOP;
    
    -- Update all invoice payment statuses
    UPDATE public.invoices 
    SET 
        amount_paid = COALESCE((
            SELECT SUM(amount) 
            FROM public.payments 
            WHERE invoice_id = invoices.id 
            AND status = 'completed'
        ), 0),
        payment_status = CASE 
            WHEN COALESCE((
                SELECT SUM(amount) 
                FROM public.payments 
                WHERE invoice_id = invoices.id 
                AND status = 'completed'
            ), 0) >= amount_due THEN 'paid'
            WHEN COALESCE((
                SELECT SUM(amount) 
                FROM public.payments 
                WHERE invoice_id = invoices.id 
                AND status = 'completed'
            ), 0) > 0 THEN 'partial'
            ELSE 'pending'
        END;
END;
$$ LANGUAGE plpgsql;

-- Run the sync function
SELECT sync_payments_with_invoices();

-- Create function to get student payment summary
CREATE OR REPLACE FUNCTION get_student_payment_summary(student_id_param UUID)
RETURNS TABLE (
    total_invoiced DECIMAL(10,2),
    total_paid DECIMAL(10,2),
    outstanding_balance DECIMAL(10,2),
    paid_invoices_count INTEGER,
    pending_invoices_count INTEGER,
    overdue_invoices_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.amount_due), 0) as total_invoiced,
        COALESCE(SUM(i.amount_paid), 0) as total_paid,
        COALESCE(SUM(i.amount_due - i.amount_paid), 0) as outstanding_balance,
        COUNT(CASE WHEN i.payment_status = 'paid' THEN 1 END) as paid_invoices_count,
        COUNT(CASE WHEN i.payment_status = 'pending' THEN 1 END) as pending_invoices_count,
        COUNT(CASE WHEN i.payment_status = 'overdue' THEN 1 END) as overdue_invoices_count
    FROM public.invoices i
    WHERE i.student_id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_student_payment ON public.invoices(student_id, payment_status); 