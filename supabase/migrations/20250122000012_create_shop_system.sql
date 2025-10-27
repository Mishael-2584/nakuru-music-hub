-- Shop categories table
CREATE TABLE shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Shop products table
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES shop_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  image_filename TEXT,
  specs TEXT,
  brand TEXT,
  delivery_days_min INTEGER,
  delivery_days_max INTEGER,
  availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'on_demand', 'out_of_stock')),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product variants (for sizes, colors, etc.)
CREATE TABLE shop_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL, -- e.g., "Size: M" or "Color: Red"
  variant_type TEXT NOT NULL, -- e.g., "size", "color"
  variant_value TEXT NOT NULL, -- e.g., "M", "Red"
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shopping cart
CREATE TABLE shop_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES shop_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES shop_product_variants(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

-- Shop orders
CREATE TABLE shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  shipping_address TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items
CREATE TABLE shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES shop_product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop invoices
CREATE TABLE shop_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_shop_products_category ON shop_products(category_id);
CREATE INDEX idx_shop_products_active ON shop_products(is_active);
CREATE INDEX idx_shop_cart_user ON shop_cart_items(user_id);
CREATE INDEX idx_shop_orders_user ON shop_orders(user_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_order_items_order ON shop_order_items(order_id);

-- RLS Policies
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invoices ENABLE ROW LEVEL SECURITY;

-- Public read access for products
CREATE POLICY "Anyone can view active categories" ON shop_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active products" ON shop_products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active variants" ON shop_product_variants FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage categories" ON shop_categories FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage products" ON shop_products FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can manage variants" ON shop_product_variants FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);

-- Cart policies
CREATE POLICY "Users can view own cart" ON shop_cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cart" ON shop_cart_items FOR ALL USING (auth.uid() = user_id);

-- Order policies
CREATE POLICY "Users can view own orders" ON shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON shop_orders FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update orders" ON shop_orders FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);

-- Order items policies
CREATE POLICY "Users can view own order items" ON shop_order_items FOR SELECT USING (
  order_id IN (SELECT id FROM shop_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON shop_order_items FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);

-- Invoice policies
CREATE POLICY "Users can view own invoices" ON shop_invoices FOR SELECT USING (
  order_id IN (SELECT id FROM shop_orders WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can manage invoices" ON shop_invoices FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin'))
);

-- Insert default categories
INSERT INTO shop_categories (name, slug, description, icon, display_order) VALUES
('Performance Tracks', 'performance-tracks', 'High-quality instrumental backing tracks', 'Music', 1),
('Instruments & Accessories', 'instruments-accessories', 'Musical instruments and essential accessories', 'Guitar', 2),
('Merchandise', 'merchandise', 'Official Damon Music Academy branded merchandise', 'Shirt', 3);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('shop_order_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE shop_order_seq;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_shop_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'SHOP-INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('shop_invoice_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE shop_invoice_seq;
