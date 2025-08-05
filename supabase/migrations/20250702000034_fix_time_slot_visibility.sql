-- Migration: Fix time slot visibility and type issues
-- Date: 2025-07-02

-- Function to get available time slots with proper date calculation
CREATE OR REPLACE FUNCTION get_available_time_slots_for_student(student_id_param UUID)
RETURNS TABLE (
  id UUID,
  teacher_id UUID,
  teacher_name TEXT,
  teacher_email TEXT,
  day_of_week TEXT,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  slot_type TEXT,
  max_students INTEGER,
  description TEXT,
  next_available_date DATE,
  has_conflict BOOLEAN
) AS $$
DECLARE
  slot_record RECORD;
  next_date DATE;
  has_conflict_val BOOLEAN;
BEGIN
  -- Loop through all available time slots
  FOR slot_record IN 
    SELECT 
      ts.id,
      ts.teacher_id,
      t.name as teacher_name,
      t.email as teacher_email,
      ts.day_of_week,
      ts.start_time,
      ts.end_time,
      ts.is_available,
      ts.slot_type,
      ts.max_students,
      ts.description
    FROM public.time_slots ts
    JOIN public.teachers t ON ts.teacher_id = t.id
    WHERE ts.is_available = true 
    AND t.status IN ('active', 'approved')
    ORDER BY ts.day_of_week, ts.start_time
  LOOP
    -- Calculate next available date for this day of week
    next_date := CASE 
      WHEN slot_record.day_of_week = 'Monday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 1 THEN 
            CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (8 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Tuesday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 2 THEN 
            CURRENT_DATE + (2 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (9 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Wednesday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 3 THEN 
            CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (10 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Thursday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 4 THEN 
            CURRENT_DATE + (4 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (11 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Friday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 5 THEN 
            CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (12 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Saturday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 6 THEN 
            CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
          ELSE 
            CURRENT_DATE + (13 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      WHEN slot_record.day_of_week = 'Sunday' THEN 
        CASE 
          WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 
            CURRENT_DATE
          ELSE 
            CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        END
      ELSE CURRENT_DATE
    END;

    -- Check if student has a conflict on this date and time
    SELECT EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE student_id = student_id_param 
      AND booking_date = next_date 
      AND status = 'confirmed'
      AND (
        (start_time < slot_record.end_time AND end_time > slot_record.start_time)
        OR (start_time = slot_record.start_time AND end_time = slot_record.end_time)
      )
    ) INTO has_conflict_val;

    -- Return the slot with calculated date and conflict status
    RETURN QUERY SELECT 
      slot_record.id,
      slot_record.teacher_id,
      slot_record.teacher_name,
      slot_record.teacher_email,
      slot_record.day_of_week,
      slot_record.start_time,
      slot_record.end_time,
      slot_record.is_available,
      slot_record.slot_type,
      slot_record.max_students,
      slot_record.description,
      next_date,
      has_conflict_val;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a time slot is bookable (not past time)
CREATE OR REPLACE FUNCTION is_slot_bookable(slot_day TEXT, slot_start_time TIME, hours_ahead INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  next_date DATE;
  slot_datetime TIMESTAMP;
BEGIN
  -- Calculate next occurrence of the day
  next_date := CASE 
    WHEN slot_day = 'Monday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 1 THEN 
          CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (8 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Tuesday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 2 THEN 
          CURRENT_DATE + (2 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (9 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Wednesday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 3 THEN 
          CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (10 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Thursday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 4 THEN 
          CURRENT_DATE + (4 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (11 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Friday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 5 THEN 
          CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (12 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Saturday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 6 THEN 
          CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (13 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN slot_day = 'Sunday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 
          CURRENT_DATE
        ELSE 
          CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    ELSE CURRENT_DATE
  END;
  
  -- Create slot datetime
  slot_datetime := (next_date + slot_start_time)::TIMESTAMP;
  
  -- Check if slot is at least 'hours_ahead' hours in the future
  RETURN slot_datetime > (CURRENT_TIMESTAMP + (hours_ahead || ' hours')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- Function to get next available date for a day of week
CREATE OR REPLACE FUNCTION get_next_available_date(day_of_week_param TEXT)
RETURNS DATE AS $$
BEGIN
  RETURN CASE 
    WHEN day_of_week_param = 'Monday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 1 THEN 
          CURRENT_DATE + (1 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (8 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Tuesday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 2 THEN 
          CURRENT_DATE + (2 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (9 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Wednesday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 3 THEN 
          CURRENT_DATE + (3 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (10 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Thursday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 4 THEN 
          CURRENT_DATE + (4 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (11 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Friday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 5 THEN 
          CURRENT_DATE + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (12 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Saturday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) <= 6 THEN 
          CURRENT_DATE + (6 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        ELSE 
          CURRENT_DATE + (13 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    WHEN day_of_week_param = 'Sunday' THEN 
      CASE 
        WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 
          CURRENT_DATE
        ELSE 
          CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
      END
    ELSE CURRENT_DATE
  END;
END;
$$ LANGUAGE plpgsql; 