-- Migration: Update cancellation policy to allow 2 make-up credits per month and exclude group sessions
-- Date: 2025-07-02

-- Update the cancellation policy function to allow 2 credits per month and exclude group sessions
CREATE OR REPLACE FUNCTION cancel_booking_with_policy(
  booking_id UUID,
  cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  time_slot_record RECORD;
  is_late BOOLEAN;
  result JSON;
  makeup_credit_id UUID;
  current_month_credits INTEGER;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record 
  FROM public.bookings 
  WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Booking not found');
  END IF;
  
  -- Check if already cancelled
  IF booking_record.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'message', 'Booking is already cancelled');
  END IF;
  
  -- Get time slot details to check if it's a group session
  SELECT * INTO time_slot_record 
  FROM public.time_slots 
  WHERE id = booking_record.time_slot_id;
  
  -- Check if it's a late cancellation
  is_late := is_late_cancellation(booking_record.booking_date, booking_record.start_time);
  
  -- Update booking status
  UPDATE public.bookings 
  SET 
    status = 'cancelled',
    cancellation_reason = cancel_booking_with_policy.cancellation_reason,
    cancelled_at = NOW(),
    cancelled_by = auth.uid(),
    is_late_cancellation = is_late,
    forfeited = is_late,
    updated_at = NOW()
  WHERE id = booking_id;
  
  -- If it's not a late cancellation, check if we can create makeup credit
  IF NOT is_late THEN
    -- Check if it's a group session (max_students > 1)
    IF time_slot_record.max_students > 1 THEN
      -- No makeup credits for group sessions
      result := json_build_object(
        'success', true,
        'is_late_cancellation', is_late,
        'forfeited', is_late,
        'makeup_credit_created', false,
        'message', 'Lesson cancelled successfully. No make-up credit issued for group sessions as per policy.'
      );
    ELSE
      -- Check if student already has 2 makeup credits this month
      SELECT COUNT(*) INTO current_month_credits
      FROM public.makeup_credits 
      WHERE student_id = booking_record.student_id 
      AND created_at >= date_trunc('month', NOW())
      AND credit_type = 'cancellation';
      
      IF current_month_credits < 2 THEN
        -- Create makeup credit
        INSERT INTO public.makeup_credits (
          student_id, 
          teacher_id, 
          original_booking_id, 
          credit_type, 
          expires_at
        ) VALUES (
          booking_record.student_id,
          booking_record.teacher_id,
          booking_record.id,
          'cancellation',
          NOW() + INTERVAL '3 months'
        ) RETURNING id INTO makeup_credit_id;
        
        result := json_build_object(
          'success', true,
          'is_late_cancellation', is_late,
          'forfeited', is_late,
          'makeup_credit_created', true,
          'message', 'Lesson cancelled successfully. A make-up lesson credit has been added to your account.'
        );
      ELSE
        -- Student has reached monthly limit
        result := json_build_object(
          'success', true,
          'is_late_cancellation', is_late,
          'forfeited', is_late,
          'makeup_credit_created', false,
          'message', 'Lesson cancelled successfully. No make-up credit issued as you have reached the monthly limit of 2 credits.'
        );
      END IF;
    END IF;
  ELSE
    -- Late cancellation
    result := json_build_object(
      'success', true,
      'is_late_cancellation', is_late,
      'forfeited', is_late,
      'makeup_credit_created', false,
      'message', 'Lesson cancelled but forfeited due to late cancellation'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update the CancellationPolicy page content
-- Note: This would need to be updated in the React component as well 