-- Migration: Remove conflicting triggers and outdated booking count logic
-- This migration removes the old triggers that were interfering with the new validation logic

-- Drop the old trigger that was causing conflicts
DROP TRIGGER IF EXISTS trigger_update_booking_counts ON public.bookings;

-- Drop the old function as we now calculate dynamically
DROP FUNCTION IF EXISTS update_booking_counts();

-- Update the old get_student_booking_status function to use the new dynamic calculation
-- and make it consistent with our new approach
CREATE OR REPLACE FUNCTION get_student_booking_status(student_id_param UUID)
RETURNS TABLE (
  sessions_per_week INTEGER,
  current_week_bookings INTEGER,
  remaining_sessions INTEGER,
  can_book_more BOOLEAN
) AS $$
DECLARE
  week_start_calc DATE;
  week_end_calc DATE;
BEGIN
  -- Calculate current week boundaries consistently
  week_start_calc := DATE_TRUNC('week', CURRENT_DATE);
  week_end_calc := week_start_calc + INTERVAL '6 days';
  
  RETURN QUERY
  SELECT 
    COALESCE(s.sessions_per_week, 1) as sessions_per_week,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status = 'confirmed'
    ), 0) as current_week_bookings,
    GREATEST(0, COALESCE(s.sessions_per_week, 1) - COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status = 'confirmed'
    ), 0)) as remaining_sessions,
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM public.bookings b 
      WHERE b.student_id = s.id 
      AND b.booking_date >= week_start_calc
      AND b.booking_date <= week_end_calc
      AND b.status = 'confirmed'
    ), 0) < COALESCE(s.sessions_per_week, 1) as can_book_more
  FROM public.students s
  WHERE s.id = student_id_param;
END;
$$ LANGUAGE plpgsql;

-- Since we now calculate dynamically, we can clear the current_week_bookings column
-- to avoid confusion (though we'll keep it for backward compatibility)
UPDATE public.students 
SET current_week_bookings = 0;

-- Add a comment to explain that current_week_bookings is now deprecated
COMMENT ON COLUMN public.students.current_week_bookings IS 
'DEPRECATED: This column is no longer actively maintained. 
Use get_student_booking_status() or validate_student_booking_capacity() functions 
which calculate current bookings dynamically from the bookings table.';

-- Grant permissions for the updated function
GRANT EXECUTE ON FUNCTION get_student_booking_status(UUID) TO authenticated;

-- Log the cleanup
DO $$
BEGIN
    RAISE NOTICE 'Removed conflicting triggers and updated booking validation to use dynamic calculation';
    RAISE NOTICE 'All booking validation now uses consistent week calculation logic';
END $$;