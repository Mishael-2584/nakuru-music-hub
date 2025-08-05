-- Migration: Fix existing makeup credits expiry dates
-- Date: 2025-07-02

-- Update existing makeup credits to have correct expiry dates based on their creation month
UPDATE public.makeup_credits 
SET expires_at = get_end_of_month(DATE(created_at))
WHERE expires_at IS NULL OR expires_at != get_end_of_month(DATE(created_at));

-- Show the results of the update
SELECT 
  id,
  credit_type,
  created_at,
  expires_at,
  (expires_at - CURRENT_DATE) as days_until_expiry,
  reason
FROM public.makeup_credits 
ORDER BY created_at DESC; 