-- Drop and recreate the RPC functions with simpler logic
DROP FUNCTION IF EXISTS generate_order_number();
DROP FUNCTION IF EXISTS generate_shop_invoice_number();

-- Create a simple generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_number TEXT;
    counter INTEGER;
BEGIN
    -- Simple counter based on current timestamp
    counter := EXTRACT(EPOCH FROM NOW())::INTEGER;
    order_number := 'ORD-' || counter;
    
    RETURN order_number;
END;
$$;

-- Create a simple generate_shop_invoice_number function
CREATE OR REPLACE FUNCTION generate_shop_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invoice_number TEXT;
    counter INTEGER;
BEGIN
    -- Simple counter based on current timestamp
    counter := EXTRACT(EPOCH FROM NOW())::INTEGER;
    invoice_number := 'INV-' || counter;
    
    RETURN invoice_number;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_order_number() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_shop_invoice_number() TO anon, authenticated;
