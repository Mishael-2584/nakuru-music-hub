-- Migration: Add booking overlap constraint to prevent double bookings
-- This migration adds a unique constraint to prevent students from booking overlapping sessions

-- Add a unique constraint to prevent overlapping bookings for the same student
-- This ensures that a student cannot have multiple confirmed bookings at the same time
-- Note: We'll use a partial index instead of a WHERE clause in UNIQUE constraint
-- First, let's clean up any existing duplicates by keeping only the most recent booking
DELETE FROM public.bookings 
WHERE id NOT IN (
  SELECT DISTINCT ON (student_id, booking_date, start_time, end_time) id
  FROM public.bookings 
  WHERE status = 'confirmed'
  ORDER BY student_id, booking_date, start_time, end_time, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_booking_time 
ON public.bookings (student_id, booking_date, start_time, end_time) 
WHERE status = 'confirmed';

-- Add a check constraint to prevent overlapping time ranges for the same student on the same date
-- This is a more comprehensive check that prevents any time overlap
CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any overlapping bookings for the same student on the same date
  IF EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE student_id = NEW.student_id 
    AND booking_date = NEW.booking_date 
    AND status = 'confirmed'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
    AND (
      (NEW.start_time < end_time AND NEW.end_time > start_time)
    )
  ) THEN
    RAISE EXCEPTION 'Booking overlap detected: Student already has a lesson scheduled during this time period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for overlaps before insert or update
DROP TRIGGER IF EXISTS trigger_check_booking_overlap ON public.bookings;
CREATE TRIGGER trigger_check_booking_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_overlap();

-- Add index to improve performance of overlap checks
CREATE INDEX IF NOT EXISTS idx_bookings_student_date_time 
ON public.bookings (student_id, booking_date, start_time, end_time, status);

-- Add a function to get overlapping bookings for a student
CREATE OR REPLACE FUNCTION get_student_overlapping_bookings(
  student_id_param UUID,
  booking_date_param DATE,
  start_time_param TIME,
  end_time_param TIME
)
RETURNS TABLE (
  booking_id UUID,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  teacher_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.booking_date,
    b.start_time,
    b.end_time,
    t.name as teacher_name
  FROM public.bookings b
  LEFT JOIN public.teachers t ON b.teacher_id = t.id
  WHERE b.student_id = student_id_param 
  AND b.booking_date = booking_date_param 
  AND b.status = 'confirmed'
  AND (
    (start_time_param < b.end_time AND end_time_param > b.start_time)
  );
END;
$$ LANGUAGE plpgsql; 