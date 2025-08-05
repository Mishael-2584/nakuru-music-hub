-- Migration: Enhance makeup credits system with proper rules
-- Date: 2025-07-02

-- Function to get the end of month for a given date
CREATE OR REPLACE FUNCTION get_end_of_month(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN (DATE_TRUNC('month', input_date) + INTERVAL '1 month - 1 day')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check student's monthly cancellation count
CREATE OR REPLACE FUNCTION get_student_monthly_cancellations(student_id_param UUID, month_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  cancellation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cancellation_count
  FROM public.bookings
  WHERE student_id = student_id_param
  AND status = 'cancelled'
  AND DATE_TRUNC('month', booking_date) = DATE_TRUNC('month', month_date);
  
  RETURN cancellation_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check student's monthly makeup credits count
CREATE OR REPLACE FUNCTION get_student_monthly_makeup_credits(student_id_param UUID, month_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  credit_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO credit_count
  FROM public.makeup_credits
  WHERE student_id = student_id_param
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', month_date);
  
  RETURN credit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student can cancel (max 2 per month)
CREATE OR REPLACE FUNCTION can_student_cancel(student_id_param UUID)
RETURNS JSON AS $$
DECLARE
  current_cancellations INTEGER;
  result JSON;
BEGIN
  current_cancellations := get_student_monthly_cancellations(student_id_param);
  
  IF current_cancellations >= 2 THEN
    result := json_build_object(
      'can_cancel', false,
      'reason', 'Monthly cancellation limit reached (2 per month)',
      'current_cancellations', current_cancellations,
      'limit', 2
    );
  ELSE
    result := json_build_object(
      'can_cancel', true,
      'current_cancellations', current_cancellations,
      'remaining', 2 - current_cancellations
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student can receive makeup credit
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
      'reason', 'Monthly makeup credit limit reached (2 per month)',
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

-- Enhanced booking validation function that considers makeup credits
CREATE OR REPLACE FUNCTION validate_student_booking_capacity(
  student_id_param UUID,
  booking_date_param DATE
)
RETURNS JSON AS $$
DECLARE
  student_record RECORD;
  current_bookings INTEGER;
  available_makeup_credits INTEGER;
  total_capacity INTEGER;
  result JSON;
BEGIN
  -- Get student's session limit
  SELECT sessions_per_week INTO student_record
  FROM public.students
  WHERE id = student_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('can_book', false, 'reason', 'Student not found');
  END IF;
  
  -- Count current bookings for the week
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE student_id = student_id_param
  AND booking_date >= DATE_TRUNC('week', booking_date_param)
  AND booking_date < DATE_TRUNC('week', booking_date_param) + INTERVAL '1 week'
  AND status = 'confirmed';
  
  -- Count available makeup credits
  SELECT COUNT(*) INTO available_makeup_credits
  FROM public.makeup_credits
  WHERE student_id = student_id_param
  AND is_used = false
  AND expires_at >= CURRENT_DATE;
  
  -- Calculate total capacity (regular sessions + makeup credits)
  total_capacity := student_record.sessions_per_week + available_makeup_credits;
  
  IF current_bookings >= total_capacity THEN
    result := json_build_object(
      'can_book', false,
      'reason', 'Weekly booking limit reached',
      'current_bookings', current_bookings,
      'total_capacity', total_capacity,
      'regular_sessions', student_record.sessions_per_week,
      'available_makeup_credits', available_makeup_credits
    );
  ELSE
    result := json_build_object(
      'can_book', true,
      'current_bookings', current_bookings,
      'total_capacity', total_capacity,
      'remaining_slots', total_capacity - current_bookings,
      'regular_sessions', student_record.sessions_per_week,
      'available_makeup_credits', available_makeup_credits
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_student_makeup_credits(UUID);

-- Update the existing makeup credits function to use proper expiration
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
    mc.reason
  FROM public.makeup_credits mc
  WHERE mc.student_id = student_id_param
  ORDER BY mc.created_at DESC;
END;
$$ LANGUAGE plpgsql; 