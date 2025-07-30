-- Migration: Implement slot management system
-- This migration ensures that when bookings are made, time slots are marked as unavailable

-- Create function to update time slot availability when booking is created
CREATE OR REPLACE FUNCTION update_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is created, mark the corresponding time slot as unavailable
  IF TG_OP = 'INSERT' THEN
    UPDATE public.time_slots 
    SET is_available = false
    WHERE teacher_id = NEW.teacher_id
      AND day_of_week = TO_CHAR(NEW.booking_date::date, 'Day')
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time;
    
    RETURN NEW;
  END IF;
  
  -- When a booking is cancelled, mark the corresponding time slot as available
  IF TG_OP = 'UPDATE' AND OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE public.time_slots 
    SET is_available = true
    WHERE teacher_id = NEW.teacher_id
      AND day_of_week = TO_CHAR(NEW.booking_date::date, 'Day')
      AND start_time = NEW.start_time
      AND end_time = NEW.end_time;
    
    RETURN NEW;
  END IF;
  
  -- When a booking is deleted, mark the corresponding time slot as available
  IF TG_OP = 'DELETE' THEN
    UPDATE public.time_slots 
    SET is_available = true
    WHERE teacher_id = OLD.teacher_id
      AND day_of_week = TO_CHAR(OLD.booking_date::date, 'Day')
      AND start_time = OLD.start_time
      AND end_time = OLD.end_time;
    
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update time slot availability
DROP TRIGGER IF EXISTS trigger_update_time_slot_availability ON public.bookings;
CREATE TRIGGER trigger_update_time_slot_availability
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_availability();

-- Create function to sync existing bookings with time slots
CREATE OR REPLACE FUNCTION sync_existing_bookings_with_slots()
RETURNS void AS $$
BEGIN
  -- Mark time slots as unavailable for all existing bookings
  UPDATE public.time_slots 
  SET is_available = false
  WHERE EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.teacher_id = time_slots.teacher_id
      AND TO_CHAR(b.booking_date::date, 'Day') = time_slots.day_of_week
      AND b.start_time = time_slots.start_time
      AND b.end_time = time_slots.end_time
      AND b.status != 'cancelled'
  );
  
  RAISE NOTICE 'Synced existing bookings with time slots';
END;
$$ LANGUAGE plpgsql;

-- Run the sync function to update existing data
SELECT sync_existing_bookings_with_slots();

-- Create function to check slot availability
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_teacher_id UUID,
  p_day_of_week TEXT,
  p_start_time TIME,
  p_end_time TIME,
  p_booking_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  slot_exists BOOLEAN;
  booking_exists BOOLEAN;
BEGIN
  -- Check if time slot exists and is available
  SELECT EXISTS(
    SELECT 1 FROM public.time_slots 
    WHERE teacher_id = p_teacher_id
      AND day_of_week = p_day_of_week
      AND start_time = p_start_time
      AND end_time = p_end_time
      AND is_available = true
  ) INTO slot_exists;
  
  -- Check if there's already a booking for this slot
  SELECT EXISTS(
    SELECT 1 FROM public.bookings 
    WHERE teacher_id = p_teacher_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND end_time = p_end_time
      AND status != 'cancelled'
  ) INTO booking_exists;
  
  RETURN slot_exists AND NOT booking_exists;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_date_time ON public.bookings(teacher_id, booking_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_teacher_day_time ON public.time_slots(teacher_id, day_of_week, start_time, end_time); 