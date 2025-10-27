-- Add address fields to shop_orders table
ALTER TABLE shop_orders 
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS county VARCHAR(100),
ADD COLUMN IF NOT EXISTS town VARCHAR(100),
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Update existing orders to have default values
UPDATE shop_orders 
SET 
  country = 'Kenya',
  county = 'Nairobi',
  town = 'Nairobi',
  street_address = shipping_address,
  postal_code = '',
  delivery_fee = 200
WHERE country IS NULL;

-- Add constraints
ALTER TABLE shop_orders 
ALTER COLUMN country SET NOT NULL,
ALTER COLUMN town SET NOT NULL,
ALTER COLUMN street_address SET NOT NULL;
