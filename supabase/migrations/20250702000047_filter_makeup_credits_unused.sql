-- Migration: Ensure get_student_makeup_credits only returns unused, unexpired credits by default
-- Date: 2025-07-02

-- Drop existing function to change logic
DROP FUNCTION IF EXISTS get_student_makeup_credits(UUID);

-- Recreate function to filter to unused and unexpired credits
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
    AND mc.is_used = false
    AND mc.expires_at >= CURRENT_DATE
  ORDER BY mc.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- Date: 2025-07-02

-- Drop existing function to change logic
DROP FUNCTION IF EXISTS get_student_makeup_credits(UUID);

-- Recreate function to filter to unused and unexpired credits
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
    AND mc.is_used = false
    AND mc.expires_at >= CURRENT_DATE
  ORDER BY mc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

