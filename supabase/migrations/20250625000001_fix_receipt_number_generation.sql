-- Fix the receipt number generation function to handle edge cases better
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    receipt_num TEXT;
    year_part TEXT;
    sequence_num INTEGER;
    max_receipt TEXT;
BEGIN
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get the maximum receipt number for this year more safely
    SELECT MAX(receipt_number)
    INTO max_receipt
    FROM public.registrations 
    WHERE receipt_number LIKE 'DMA-' || year_part || '-%';
    
    -- Extract sequence number more safely
    IF max_receipt IS NULL THEN
        sequence_num := 1;
    ELSE
        -- Extract the numeric part after the year
        sequence_num := COALESCE(
            CAST(SUBSTRING(max_receipt FROM 9) AS INTEGER), 
            0
        ) + 1;
    END IF;
    
    -- Format: DMA-YYYY-XXXXX (e.g., DMA-2024-00001)
    receipt_num := 'DMA-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN receipt_num;
END;
$$;

-- Also add a fallback mechanism in the trigger
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 10;
    new_receipt TEXT;
BEGIN
    -- Only set if not already provided
    IF NEW.receipt_number IS NULL THEN
        -- Try to generate a unique receipt number
        LOOP
            attempt_count := attempt_count + 1;
            new_receipt := generate_receipt_number();
            
            -- Check if this receipt number already exists
            IF NOT EXISTS (
                SELECT 1 FROM public.registrations 
                WHERE receipt_number = new_receipt
            ) THEN
                NEW.receipt_number := new_receipt;
                EXIT;
            END IF;
            
            -- Prevent infinite loop
            IF attempt_count >= max_attempts THEN
                RAISE EXCEPTION 'Failed to generate unique receipt number after % attempts', max_attempts;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$; 