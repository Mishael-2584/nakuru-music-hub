-- Migration: Fix day_of_week format in time slot management
-- Date: 2025-09-08

-- Update the function to use TRIM to remove trailing spaces from day_of_week
CREATE OR REPLACE FUNCTION update_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is created, mark the corresponding time slot as unavailable
  IF TG_OP = 'INSERT' THEN
    UPDATE public.time_slots 
    SET is_available = false
    WHERE teacher_id = NEW.teacher_id
      AND day_of_week = TRIM(TO_CHAR(NEW.booking_date::date, 'Day'))
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time;
    
    RETURN NEW;
  END IF;
  
  -- When a booking is cancelled, mark the corresponding time slot as available
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.time_slots 
    SET is_available = true
    WHERE teacher_id = NEW.teacher_id
      AND day_of_week = TRIM(TO_CHAR(NEW.booking_date::date, 'Day'))
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time;
    
    RETURN NEW;
  END IF;
  
  -- When a booking is deleted, mark the corresponding time slot as available
  IF TG_OP = 'DELETE' THEN
    UPDATE public.time_slots 
    SET is_available = true
    WHERE teacher_id = OLD.teacher_id
      AND day_of_week = TRIM(TO_CHAR(OLD.booking_date::date, 'Day'))
      AND start_time = OLD.start_time
      AND end_time = OLD.end_time;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a function to fix existing time slots with trailing spaces
CREATE OR REPLACE FUNCTION fix_day_of_week_trailing_spaces()
RETURNS TEXT AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update any time slots with trailing spaces in day_of_week
  WITH slots_to_update AS (
    SELECT id, day_of_week, TRIM(day_of_week) AS trimmed_day
    FROM public.time_slots
    WHERE day_of_week != TRIM(day_of_week)
  )
  UPDATE public.time_slots ts
  SET day_of_week = stu.trimmed_day
  FROM slots_to_update stu
  WHERE ts.id = stu.id;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN 'Fixed ' || updated_count || ' time slots with trailing spaces in day_of_week';
END;
$$ LANGUAGE plpgsql;

-- Execute the fix function
SELECT fix_day_of_week_trailing_spaces();