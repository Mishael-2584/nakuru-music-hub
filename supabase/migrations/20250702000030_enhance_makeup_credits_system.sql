-- Migration: Enhance make-up credits system with usage tracking
-- Date: 2025-07-02

-- Function to check if student has available make-up credits
CREATE OR REPLACE FUNCTION check_student_makeup_credits(student_id_param UUID)
RETURNS JSON AS $$
DECLARE
  available_credits INTEGER;
  result JSON;
BEGIN
  -- Count available make-up credits (not used, not expired)
  SELECT COUNT(*) INTO available_credits
  FROM public.makeup_credits 
  WHERE student_id = student_id_param 
  AND is_used = false 
  AND expires_at > NOW();
  
  result := json_build_object(
    'has_credits', available_credits > 0,
    'available_credits', available_credits,
    'success', true
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to use a make-up credit for booking
CREATE OR REPLACE FUNCTION use_makeup_credit_for_booking(
  student_id_param UUID,
  booking_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  credit_record RECORD;
  result JSON;
BEGIN
  -- Get the oldest available make-up credit
  SELECT * INTO credit_record
  FROM public.makeup_credits 
  WHERE student_id = student_id_param 
  AND is_used = false 
  AND expires_at > NOW()
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No available make-up credits found'
    );
  END IF;
  
  -- Mark the credit as used and link it to the booking
  UPDATE public.makeup_credits 
  SET 
    is_used = true,
    used_at = NOW(),
    used_for_booking_id = booking_id_param
  WHERE id = credit_record.id;
  
  -- Update the booking to indicate it used a make-up credit
  UPDATE public.bookings 
  SET 
    lesson_type = 'makeup',
    used_makeup_credit_id = credit_record.id
  WHERE id = booking_id_param;
  
  result := json_build_object(
    'success', true,
    'credit_id', credit_record.id,
    'message', 'Make-up credit used successfully for this booking'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get student's make-up credits with details
CREATE OR REPLACE FUNCTION get_student_makeup_credits(student_id_param UUID)
RETURNS TABLE (
  id UUID,
  credit_type TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_used BOOLEAN,
  used_at TIMESTAMPTZ,
  used_for_booking_id UUID,
  days_until_expiry INTEGER
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
    EXTRACT(DAY FROM (mc.expires_at - NOW()))::INTEGER as days_until_expiry
  FROM public.makeup_credits mc
  WHERE mc.student_id = student_id_param
  ORDER BY mc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add columns to bookings table for make-up credit tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS used_makeup_credit_id UUID REFERENCES public.makeup_credits(id);

-- Add columns to makeup_credits table for better tracking
ALTER TABLE public.makeup_credits 
ADD COLUMN IF NOT EXISTS used_for_booking_id UUID REFERENCES public.bookings(id),
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Create index for better performance (without NOW() function in predicate)
CREATE INDEX IF NOT EXISTS idx_makeup_credits_student_available 
ON public.makeup_credits(student_id, is_used, expires_at) 
WHERE is_used = false; 