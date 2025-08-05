-- Migration: Update cancellation policy to implement new limit
-- This migration updates the cancellation logic to allow cancellations beyond 2 per billing period
-- but without issuing make-up credits and charging as if it were a no-show

-- Update the can_student_cancel function to allow unlimited cancellations
CREATE OR REPLACE FUNCTION can_student_cancel(student_id_param UUID)
RETURNS JSON AS $$
DECLARE
  current_cancellations INTEGER;
  result JSON;
BEGIN
  current_cancellations := get_student_monthly_cancellations(student_id_param);
  
  -- Always allow cancellation, but track the count for make-up credit eligibility
  result := json_build_object(
    'can_cancel', true,
    'current_cancellations', current_cancellations,
    'remaining_credits', GREATEST(0, 2 - current_cancellations),
    'will_receive_credit', current_cancellations < 2
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the can_receive_makeup_credit function to enforce the 2-per-billing-period limit
CREATE OR REPLACE FUNCTION can_receive_makeup_credit(student_id_param UUID)
RETURNS JSON AS $$
DECLARE
  current_credits INTEGER;
  result JSON;
BEGIN
  current_credits := get_student_monthly_makeup_credits(student_id_param);
  
  IF current_credits >= 2 THEN
    result := json_build_object(
      'can_receive', false,
      'reason', 'Monthly makeup credit limit reached (2 per billing period)',
      'current_credits', current_credits,
      'limit', 2
    );
  ELSE
    result := json_build_object(
      'can_receive', true,
      'current_credits', current_credits,
      'remaining', 2 - current_credits
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the enhanced cancellation function to implement the new policy
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
  current_cancellations INTEGER;
  result JSON;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings
  WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  student_id_val := booking_record.student_id;
  
  -- Check if student can cancel (always allowed now)
  can_cancel_result := can_student_cancel(student_id_val);
  current_cancellations := (can_cancel_result->>'current_cancellations')::INTEGER;
  
  -- Check if student can receive makeup credit (limited to 2 per billing period)
  can_receive_result := can_receive_makeup_credit(student_id_val);
  
  -- Cancel the booking
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancellation_reason = cancellation_reason_param,
    cancelled_at = NOW(),
    cancelled_by = auth.uid(),
    is_late_cancellation = false,
    forfeited = current_cancellations >= 2 -- Mark as forfeited if beyond limit
  WHERE id = booking_id_param;
  
  -- If student can receive makeup credit (within 2 per billing period), create one
  IF (can_receive_result->>'can_receive')::BOOLEAN THEN
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
      get_end_of_month(CURRENT_DATE),
      NOW()
    ) RETURNING id INTO new_credit_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Booking cancelled and makeup credit created',
      'makeup_credit_id', new_credit_id,
      'expires_at', get_end_of_month(CURRENT_DATE),
      'cancellations_used', current_cancellations + 1,
      'credits_received', (can_receive_result->>'current_credits')::INTEGER + 1,
      'forfeited', false
    );
  ELSE
    -- Beyond the 2-per-billing-period limit - no make-up credit, charge as no-show
    result := json_build_object(
      'success', true,
      'message', 'Booking cancelled. No make-up credit issued as you have exceeded the 2-cancellation limit per billing period. You will be charged for this lesson as if it were a no-show.',
      'cancellations_used', current_cancellations + 1,
      'credits_received', (can_receive_result->>'current_credits')::INTEGER,
      'forfeited', true,
      'charged_as_no_show', true
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get student's cancellation status for display
CREATE OR REPLACE FUNCTION get_student_cancellation_status(student_id_param UUID)
RETURNS JSON AS $$
DECLARE
  current_cancellations INTEGER;
  current_credits INTEGER;
  result JSON;
BEGIN
  current_cancellations := get_student_monthly_cancellations(student_id_param);
  current_credits := get_student_monthly_makeup_credits(student_id_param);
  
  result := json_build_object(
    'current_cancellations', current_cancellations,
    'current_credits', current_credits,
    'remaining_credits', GREATEST(0, 2 - current_credits),
    'can_receive_credit', current_credits < 2,
    'next_cancellation_will_be_charged', current_cancellations >= 2
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql; 