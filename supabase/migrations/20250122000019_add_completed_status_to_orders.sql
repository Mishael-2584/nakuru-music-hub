-- Add 'completed' status to shop_orders status constraint
-- First, drop the existing constraint
ALTER TABLE shop_orders 
DROP CONSTRAINT IF EXISTS shop_orders_status_check;

-- Add the new constraint with 'completed' included
ALTER TABLE shop_orders 
ADD CONSTRAINT shop_orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'));

-- Add index for the new status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_shop_orders_status_completed ON shop_orders(status) 
WHERE status = 'completed';
