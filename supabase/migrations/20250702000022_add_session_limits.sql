-- Migration: Add session limits and booking validation
-- This migration adds session tracking and validation to prevent over-booking

-- Add session tracking columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_sessions_booked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_week_bookings INTEGER DEFAULT 0;

-- Create function to check if student can book more sessions
CREATE OR REPLACE FUNCTION check_student_booking_limit(
  student_id_param UUID,
  requested_sessions INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  student_sessions_per_week INTEGER;
  current_week_bookings INTEGER;
  can_book BOOLEAN;
BEGIN
  -- Get student's session limit
  SELECT sessions_per_week INTO student_sessions_per_week
  FROM public.students
  WHERE id = student_id_param;
  
  -- Get current week bookings for this student
  SELECT COUNT(*) INTO current_week_bookings
  FROM public.bookings
  WHERE student_id = student_id_param
    AND booking_date >= date_trunc('week', current_date)
    AND booking_date < date_trunc('week', current_date) + interval '1 week'
    AND status != 'cancelled';
  
  -- Check if student can book more sessions
  can_book := (current_week_bookings + requested_sessions) <= student_sessions_per_week;
  
  RETURN can_book;
END;
$$ LANGUAGE plpgsql;

-- Create function to update booking counts
CREATE OR REPLACE FUNCTION update_booking_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_week_bookings when a booking is created/updated/deleted
  IF TG_OP = 'INSERT' THEN
    UPDATE public.students
    SET current_week_bookings = current_week_bookings + 1,
        total_sessions_booked = total_sessions_booked + 1
    WHERE id = NEW.student_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If booking date changed, update counts accordingly
    IF OLD.booking_date != NEW.booking_date THEN
      -- Decrease count for old week
      UPDATE public.students
      SET current_week_bookings = current_week_bookings - 1
      WHERE id = OLD.student_id
        AND OLD.booking_date >= date_trunc('week', current_date)
        AND OLD.booking_date < date_trunc('week', current_date) + interval '1 week';
      
      -- Increase count for new week
      UPDATE public.students
      SET current_week_bookings = current_week_bookings + 1
      WHERE id = NEW.student_id
        AND NEW.booking_date >= date_trunc('week', current_date)
        AND NEW.booking_date < date_trunc('week', current_date) + interval '1 week';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.students
    SET current_week_bookings = current_week_bookings - 1,
        total_sessions_booked = total_sessions_booked - 1
    WHERE id = OLD.student_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update booking counts
DROP TRIGGER IF EXISTS trigger_update_booking_counts ON public.bookings;
CREATE TRIGGER trigger_update_booking_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_counts();

-- Create function to reset weekly booking counts (run weekly)
CREATE OR REPLACE FUNCTION reset_weekly_booking_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE public.students
  SET current_week_bookings = 0
  WHERE current_week_bookings > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get student booking status
CREATE OR REPLACE FUNCTION get_student_booking_status(student_id_param UUID)
RETURNS TABLE (
  sessions_per_week INTEGER,
  current_week_bookings INTEGER,
  remaining_sessions INTEGER,
  can_book_more BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.sessions_per_week,
    s.current_week_bookings,
    GREATEST(0, s.sessions_per_week - s.current_week_bookings) as remaining_sessions,
    s.current_week_bookings < s.sessions_per_week as can_book_more
  FROM public.students s
  WHERE s.id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for session limit functions
CREATE POLICY "Students can view their own session limits" ON public.students
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'super_admin', 'teacher')
    )
  );

-- Update existing students with default session limits
UPDATE public.students 
SET sessions_per_week = 1 
WHERE sessions_per_week IS NULL;

-- Initialize booking counts for existing students
UPDATE public.students s
SET current_week_bookings = (
  SELECT COUNT(*)
  FROM public.bookings b
  WHERE b.student_id = s.id
    AND b.booking_date >= date_trunc('week', current_date)
    AND b.booking_date < date_trunc('week', current_date) + interval '1 week'
    AND b.status != 'cancelled'
),
total_sessions_booked = (
  SELECT COUNT(*)
  FROM public.bookings b
  WHERE b.student_id = s.id
    AND b.status != 'cancelled'
); 