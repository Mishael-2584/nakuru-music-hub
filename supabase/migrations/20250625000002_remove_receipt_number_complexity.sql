-- Simplify receipt number generation back to a basic working version
-- Remove the complex logic that's causing failures

-- Drop the current trigger and functions
DROP TRIGGER IF EXISTS trigger_set_receipt_number ON public.registrations;
DROP FUNCTION IF EXISTS set_receipt_number();
DROP FUNCTION IF EXISTS generate_receipt_number();

-- Create a simple receipt number generation function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    receipt_num TEXT;
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.registrations 
    WHERE receipt_number LIKE 'DMA-' || year_part || '-%';
    
    -- Format: DMA-YYYY-XXXXX (e.g., DMA-2024-00001)
    receipt_num := 'DMA-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN receipt_num;
END;
$$;

-- Create a simple trigger to automatically generate receipt numbers
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