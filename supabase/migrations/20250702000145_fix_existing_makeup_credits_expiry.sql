-- Migration: Fix existing makeup credits expiry dates (renumbered to avoid conflict)
UPDATE public.makeup_credits 
SET expires_at = get_end_of_month(DATE(created_at))
WHERE expires_at IS NULL OR expires_at != get_end_of_month(DATE(created_at));

-- Optional inspection
-- SELECT id, credit_type, created_at, expires_at, (expires_at - CURRENT_DATE) as days_until_expiry, reason
-- FROM public.makeup_credits ORDER BY created_at DESC;


UPDATE public.makeup_credits 
SET expires_at = get_end_of_month(DATE(created_at))
WHERE expires_at IS NULL OR expires_at != get_end_of_month(DATE(created_at));

-- Optional inspection
-- SELECT id, credit_type, created_at, expires_at, (expires_at - CURRENT_DATE) as days_until_expiry, reason
-- FROM public.makeup_credits ORDER BY created_at DESC;

