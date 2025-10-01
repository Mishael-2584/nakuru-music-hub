-- Migration: Create trial_bookings table for managing free trial class bookings
-- This enables students to book free trial classes and teachers/admins to manage them

CREATE TABLE IF NOT EXISTS public.trial_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student Information
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  student_age INTEGER NOT NULL,
  
  -- Contact Information
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Music Preferences
  instrument TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  previous_experience TEXT,
  learning_goals TEXT,
  
  -- Scheduling Preferences
  preferred_location TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  preferred_date DATE,
  
  -- Special Requirements
  special_requirements TEXT,
  
  -- Management Fields
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'converted')),
  assigned_teacher_id UUID REFERENCES public.teachers(id),
  scheduled_datetime TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON public.trial_bookings(status);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_email ON public.trial_bookings(email);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_phone ON public.trial_bookings(phone);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_instrument ON public.trial_bookings(instrument);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_assigned_teacher ON public.trial_bookings(assigned_teacher_id);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_scheduled_datetime ON public.trial_bookings(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_created_at ON public.trial_bookings(created_at);

-- Enable RLS
ALTER TABLE public.trial_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trial_bookings
-- Teachers can view and manage trial bookings assigned to them
CREATE POLICY "Teachers can manage assigned trial bookings" ON public.trial_bookings
  FOR ALL USING (
    assigned_teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all trial bookings
CREATE POLICY "Admins can manage all trial bookings" ON public.trial_bookings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.teachers WHERE category = 'admin'
    )
  );

-- Service role can manage all trial bookings (for API operations)
CREATE POLICY "Service role can manage trial bookings" ON public.trial_bookings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trial_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_trial_bookings_updated_at
  BEFORE UPDATE ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_bookings_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.trial_bookings TO authenticated;
GRANT ALL ON public.trial_bookings TO service_role;

-- Create function to get trial booking statistics
CREATE OR REPLACE FUNCTION get_trial_booking_stats()
RETURNS TABLE (
  total_bookings BIGINT,
  pending_bookings BIGINT,
  scheduled_bookings BIGINT,
  completed_bookings BIGINT,
  converted_bookings BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_bookings,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
    COUNT(*) FILTER (WHERE status = 'converted') as converted_bookings,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM public.trial_bookings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the stats function
GRANT EXECUTE ON FUNCTION get_trial_booking_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_trial_booking_stats() TO service_role;


