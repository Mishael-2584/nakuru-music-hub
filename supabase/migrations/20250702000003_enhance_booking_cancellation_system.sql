-- Migration: Enhance booking system with cancellation policy and recurring bookings
-- This migration adds support for the 24-hour cancellation policy, make-up credits, and recurring lessons

-- 1. Add cancellation policy fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_late_cancellation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS forfeited BOOLEAN DEFAULT false;

-- 2. Create make-up credits table
CREATE TABLE IF NOT EXISTS public.makeup_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  credit_type TEXT DEFAULT 'cancellation' CHECK (credit_type IN ('cancellation', 'teacher_cancellation', 'admin_granted')),
  expires_at DATE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_for_booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create recurring booking patterns table
CREATE TABLE IF NOT EXISTS public.recurring_booking_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  lesson_type TEXT DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'makeup', 'exam_prep', 'performance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create booking notifications table
CREATE TABLE IF NOT EXISTS public.booking_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('cancellation', 'confirmation', 'reminder', 'makeup_credit')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'teacher', 'admin')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS on new tables
ALTER TABLE public.makeup_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_booking_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for makeup_credits
CREATE POLICY "Students can view their own makeup credits" ON public.makeup_credits
  FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view makeup credits for their students" ON public.makeup_credits
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Students can use their own makeup credits" ON public.makeup_credits
  FOR UPDATE USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Create RLS policies for recurring_booking_patterns
CREATE POLICY "Students can manage their own recurring patterns" ON public.recurring_booking_patterns
  FOR ALL USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view recurring patterns for their slots" ON public.recurring_booking_patterns
  FOR SELECT USING (auth.uid() = teacher_id);

-- Create RLS policies for booking_notifications
CREATE POLICY "Users can view their own notifications" ON public.booking_notifications
  FOR SELECT USING (
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON public.bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_is_late_cancellation ON public.bookings(is_late_cancellation);
CREATE INDEX IF NOT EXISTS idx_makeup_credits_student_id ON public.makeup_credits(student_id);
CREATE INDEX IF NOT EXISTS idx_makeup_credits_expires_at ON public.makeup_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_makeup_credits_is_used ON public.makeup_credits(is_used);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_student_id ON public.recurring_booking_patterns(student_id);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_is_active ON public.recurring_booking_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking_id ON public.booking_notifications(booking_id);

-- Create function to check if cancellation is within 24 hours
CREATE OR REPLACE FUNCTION is_late_cancellation(booking_date DATE, booking_time TIME)
RETURNS BOOLEAN AS $$
DECLARE
  lesson_datetime TIMESTAMP;
  current_datetime TIMESTAMP;
  hours_diff NUMERIC;
BEGIN
  lesson_datetime := (booking_date + booking_time)::TIMESTAMP;
  current_datetime := NOW();
  hours_diff := EXTRACT(EPOCH FROM (lesson_datetime - current_datetime)) / 3600;
  
  RETURN hours_diff < 24;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle booking cancellation with policy enforcement
CREATE OR REPLACE FUNCTION cancel_booking_with_policy(
  booking_id UUID,
  cancellation_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  is_late BOOLEAN;
  result JSON;
  makeup_credit_id UUID;
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
  
  -- Check if it's a late cancellation
  is_late := is_late_cancellation(booking_record.booking_date, booking_record.start_time);
  
  -- Update booking status
  UPDATE public.bookings 
  SET 
    status = 'cancelled',
    cancellation_reason = cancellation_reason,
    cancelled_at = NOW(),
    cancelled_by = auth.uid(),
    is_late_cancellation = is_late,
    forfeited = is_late,
    updated_at = NOW()
  WHERE id = booking_id;
  
  -- If it's not a late cancellation, create makeup credit
  IF NOT is_late THEN
    -- Check if student already has a makeup credit this month
    IF NOT EXISTS (
      SELECT 1 FROM public.makeup_credits 
      WHERE student_id = booking_record.student_id 
      AND created_at >= date_trunc('month', NOW())
      AND credit_type = 'cancellation'
    ) THEN
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
    END IF;
  END IF;
  
  -- Return result
  result := json_build_object(
    'success', true,
    'is_late_cancellation', is_late,
    'forfeited', is_late,
    'makeup_credit_created', makeup_credit_id IS NOT NULL,
    'message', CASE 
      WHEN is_late THEN 'Lesson cancelled but forfeited due to late cancellation'
      ELSE 'Lesson cancelled successfully. Make-up credit added to your account.'
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to send booking notifications
CREATE OR REPLACE FUNCTION send_booking_notification(
  booking_id UUID,
  notification_type TEXT,
  recipient_type TEXT,
  recipient_email TEXT,
  subject TEXT,
  message TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.booking_notifications (
    booking_id,
    notification_type,
    recipient_type,
    recipient_email,
    subject,
    message
  ) VALUES (
    booking_id,
    notification_type,
    recipient_type,
    recipient_email,
    subject,
    message
  );
END;
$$ LANGUAGE plpgsql; 