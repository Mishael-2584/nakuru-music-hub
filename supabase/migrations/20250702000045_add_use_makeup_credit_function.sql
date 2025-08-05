-- Migration: Add use makeup credit for booking function
-- Date: 2025-07-02

-- Function to use a makeup credit for a booking
CREATE OR REPLACE FUNCTION use_makeup_credit_for_booking(
  student_id_param UUID,
  booking_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  available_credit RECORD;
  result JSON;
BEGIN
  -- Find an available makeup credit for the student
  SELECT * INTO available_credit
  FROM public.makeup_credits
  WHERE student_id = student_id_param
  AND is_used = false
  AND expires_at >= CURRENT_DATE
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No available makeup credits found'
    );
  END IF;
  
  -- Mark the credit as used
  UPDATE public.makeup_credits
  SET 
    is_used = true,
    used_at = NOW(),
    used_for_booking_id = booking_id_param
  WHERE id = available_credit.id;
  
  result := json_build_object(
    'success', true,
    'message', 'Makeup credit used successfully',
    'credit_id', available_credit.id,
    'credit_type', available_credit.credit_type,
    'booking_id', booking_id_param
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 