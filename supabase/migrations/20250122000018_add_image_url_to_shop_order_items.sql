-- Add image_url column to shop_order_items table to store product images
ALTER TABLE shop_order_items 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN shop_order_items.image_url IS 'URL of the product image at the time of order';
