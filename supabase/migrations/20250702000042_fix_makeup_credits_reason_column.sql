-- Migration: Fix makeup credits reason column
-- Date: 2025-07-02

-- Add the missing reason column to makeup_credits table
ALTER TABLE public.makeup_credits 
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update existing records to have a default reason
UPDATE public.makeup_credits 
SET reason = 'Lesson cancelled' 
WHERE reason IS NULL;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_student_makeup_credits(UUID);

-- Update the makeup credits function to handle the reason column properly
CREATE OR REPLACE FUNCTION get_student_makeup_credits(student_id_param UUID)
RETURNS TABLE (
  id UUID,
  credit_type TEXT,
  created_at TIMESTAMPTZ,
  expires_at DATE,
  is_used BOOLEAN,
  used_at TIMESTAMPTZ,
  used_for_booking_id UUID,
  days_until_expiry INTEGER,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.credit_type,
    mc.created_at,
    mc.expires_at,
    mc.is_used,
    mc.used_at,
    mc.used_for_booking_id,
    (mc.expires_at - CURRENT_DATE)::INTEGER as days_until_expiry,
    COALESCE(mc.reason, 'Lesson cancelled') as reason
  FROM public.makeup_credits mc
  WHERE mc.student_id = student_id_param
  ORDER BY mc.created_at DESC;
END;
$$ LANGUAGE plpgsql; 