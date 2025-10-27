-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow anonymous users to insert orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow users to view their own orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow admins to view all orders" ON shop_orders;
DROP POLICY IF EXISTS "Allow anonymous users to insert order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow users to view their own order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow admins to view all order items" ON shop_order_items;
DROP POLICY IF EXISTS "Allow anonymous users to insert invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow users to view their own invoices" ON shop_invoices;
DROP POLICY IF EXISTS "Allow admins to view all invoices" ON shop_invoices;

-- Disable RLS temporarily to allow all operations
ALTER TABLE shop_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invoices DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invoices ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations for now
CREATE POLICY "Allow all operations on shop_orders" ON shop_orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on shop_order_items" ON shop_order_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations on shop_invoices" ON shop_invoices
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON shop_orders TO anon, authenticated;
GRANT ALL ON shop_order_items TO anon, authenticated;
GRANT ALL ON shop_invoices TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
