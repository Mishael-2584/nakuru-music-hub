-- Migration: Fix makeup credits expiration logic
-- Date: 2025-07-02

-- Enhanced cancellation function with proper makeup credit creation
CREATE OR REPLACE FUNCTION cancel_booking_with_enhanced_policy(
  booking_id_param UUID,
  cancellation_reason_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  student_id_val UUID;
  can_cancel_result JSON;
  can_receive_result JSON;
  new_credit_id UUID;
  result JSON;
  credit_expiry_date DATE;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings
  WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  student_id_val := booking_record.student_id;
  
  -- Check if student can cancel
  can_cancel_result := can_student_cancel(student_id_val);
  
  IF NOT (can_cancel_result->>'can_cancel')::BOOLEAN THEN
    RETURN json_build_object(
      'success', false,
      'message', can_cancel_result->>'reason'
    );
  END IF;
  
  -- Check if student can receive makeup credit
  can_receive_result := can_receive_makeup_credit(student_id_val);
  
  -- Cancel the booking
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancellation_reason = cancellation_reason_param,
    cancelled_at = NOW()
  WHERE id = booking_id_param;
  
  -- If student can receive makeup credit, create one
  IF (can_receive_result->>'can_receive')::BOOLEAN THEN
    -- Calculate expiry date based on the booking date (when the lesson was supposed to happen)
    credit_expiry_date := get_end_of_month(booking_record.booking_date);
    
    INSERT INTO public.makeup_credits (
      student_id,
      teacher_id,
      credit_type,
      reason,
      expires_at,
      created_at
    ) VALUES (
      student_id_val,
      booking_record.teacher_id,
      'cancellation',
      COALESCE(cancellation_reason_param, 'Lesson cancelled'),
      credit_expiry_date,
      NOW()
    ) RETURNING id INTO new_credit_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Booking cancelled and makeup credit created',
      'makeup_credit_id', new_credit_id,
      'expires_at', credit_expiry_date,
      'cancellations_used', (can_cancel_result->>'current_cancellations')::INTEGER + 1,
      'credits_received', (can_receive_result->>'current_credits')::INTEGER + 1
    );
  ELSE
    result := json_build_object(
      'success', true,
      'message', 'Booking cancelled (no makeup credit - monthly limit reached)',
      'cancellations_used', (can_cancel_result->>'current_cancellations')::INTEGER + 1,
      'credits_received', (can_receive_result->>'current_credits')::INTEGER
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 