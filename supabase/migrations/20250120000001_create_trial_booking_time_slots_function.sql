-- Migration: Create function to get available time slots for trial booking
-- This function returns available teacher time slots that can be used for trial classes

CREATE OR REPLACE FUNCTION get_available_trial_time_slots(
  p_instrument TEXT DEFAULT NULL,
  p_preferred_location TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  teacher_phone TEXT,
  day_of_week TEXT,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  slot_type TEXT,
  max_students INTEGER,
  description TEXT,
  next_available_date DATE,
  has_conflict BOOLEAN,
  teacher_subjects TEXT[]
) AS $$
DECLARE
  slot_record RECORD;
  next_date DATE;
  has_conflict_val BOOLEAN;
  booked_count INTEGER;
BEGIN
  -- Loop through all available time slots for active/approved teachers
  FOR slot_record IN 
    SELECT 
      ts.id,
      ts.teacher_id,
      t.name as teacher_name,
      t.email as teacher_email,
      t.phone as teacher_phone,
      ts.day_of_week,
      ts.start_time,
      ts.end_time,
      ts.is_available,
      ts.slot_type,
      ts.max_students,
      ts.description,
      t.subjects as teacher_subjects
    FROM public.time_slots ts
    JOIN public.teachers t ON ts.teacher_id = t.id
    WHERE ts.is_available = true 
      AND t.status IN ('active', 'approved')
      AND (p_instrument IS NULL OR p_instrument = ANY(t.subjects))
    ORDER BY ts.day_of_week, ts.start_time
  LOOP
    -- Calculate next available date for this day of week
    next_date := CASE 
      WHEN slot_record.day_of_week = 'Monday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 1 THEN 
          CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (8 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Tuesday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 2 THEN 
          CURRENT_DATE + (2 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (9 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Wednesday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 3 THEN 
          CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (10 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Thursday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 4 THEN 
          CURRENT_DATE + (4 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (11 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Friday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 5 THEN 
          CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (12 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Saturday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 6 THEN 
          CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (13 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Sunday' THEN 
        CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 
          CURRENT_DATE
        ELSE 
          CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
    END;

    -- Check for conflicts (existing bookings on the next available date)
    SELECT COUNT(*) INTO booked_count
    FROM public.bookings b
    WHERE b.teacher_id = slot_record.teacher_id
      AND b.booking_date = next_date
      AND b.start_time = slot_record.start_time
      AND b.end_time = slot_record.end_time
      AND b.status != 'cancelled';

    has_conflict_val := booked_count > 0;

    -- Return the slot information
    RETURN QUERY SELECT 
      slot_record.id,
      slot_record.teacher_id,
      slot_record.teacher_name,
      slot_record.teacher_email,
      slot_record.teacher_phone,
      slot_record.day_of_week,
      slot_record.start_time,
      slot_record.end_time,
      slot_record.is_available,
      slot_record.slot_type,
      slot_record.max_students,
      slot_record.description,
      next_date,
      has_conflict_val,
      slot_record.teacher_subjects;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users (for public trial booking form)
GRANT EXECUTE ON FUNCTION get_available_trial_time_slots TO anon;
GRANT EXECUTE ON FUNCTION get_available_trial_time_slots TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_trial_time_slots TO service_role;

