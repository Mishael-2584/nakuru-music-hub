-- Create generate_order_number RPC function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'ORD-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM shop_orders
    WHERE order_number ~ '^ORD-\d+$';
    
    -- Generate order number with format ORD-XXXXXX
    order_number := 'ORD-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN order_number;
END;
$$;

-- Create generate_shop_invoice_number RPC function
CREATE OR REPLACE FUNCTION generate_shop_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invoice_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the next counter value
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM shop_invoices
    WHERE invoice_number ~ '^INV-\d+$';
    
    -- Generate invoice number with format INV-XXXXXX
    invoice_number := 'INV-' || LPAD(counter::TEXT, 6, '0');
    
    RETURN invoice_number;
END;
$$;

-- Fix RLS policies for shop_orders table
-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous users to insert orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow users to view their own orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow admins to view all orders" ON shop_orders;

-- Create new policies
CREATE POLICY "Allow anonymous users to insert orders" ON shop_orders
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert orders" ON shop_orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to view their own orders" ON shop_orders
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Allow admins to view all orders" ON shop_orders
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Fix RLS policies for shop_order_items table
DROP POLICY IF EXISTS "Allow anonymous users to insert order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow users to view their own order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow admins to view all order items" ON shop_order_items;

CREATE POLICY "Allow anonymous users to insert order items" ON shop_order_items
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert order items" ON shop_order_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to view their own order items" ON shop_order_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shop_orders 
            WHERE id = order_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to view all order items" ON shop_order_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Fix RLS policies for shop_invoices table
DROP POLICY IF EXISTS "Allow anonymous users to insert invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow users to view their own invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow admins to view all invoices" ON shop_invoices;

CREATE POLICY "Allow anonymous users to insert invoices" ON shop_invoices
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert invoices" ON shop_invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to view their own invoices" ON shop_invoices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM shop_orders 
            WHERE id = order_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to view all invoices" ON shop_invoices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
