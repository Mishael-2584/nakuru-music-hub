-- Add a flag to allow products to disable variant selection on the storefront
ALTER TABLE shop_products
ADD COLUMN IF NOT EXISTS enable_variants BOOLEAN NOT NULL DEFAULT TRUE;

-- Ensure existing rows have the flag set
UPDATE shop_products
SET enable_variants = COALESCE(enable_variants, TRUE);

