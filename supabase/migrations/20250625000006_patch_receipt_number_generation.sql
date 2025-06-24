-- Patch: Use a sequence for receipt numbers to guarantee uniqueness

-- Create the sequence if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'receipt_number_seq') THEN
        CREATE SEQUENCE receipt_number_seq START 1;
    END IF;
END $$;

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON public.registrations;
DROP FUNCTION IF EXISTS set_receipt_number();
DROP FUNCTION IF EXISTS generate_receipt_number();

-- Create a new function that uses the sequence
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    receipt_num TEXT;
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    sequence_num := nextval('receipt_number_seq');
    receipt_num := 'DMA-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    RETURN receipt_num;
END;
$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_set_receipt_number
    BEFORE INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number(); 