-- Debug migration: Check current time slots data
-- This will show us what day_of_week values are actually stored

DO $$
DECLARE
  slot_record RECORD;
  debug_info TEXT := '';
BEGIN
  -- Log current time slots data
  FOR slot_record IN 
    SELECT 
      id,
      teacher_id,
      day_of_week,
      LENGTH(day_of_week) as day_length,
      start_time,
      end_time,
      is_available
    FROM public.time_slots
    ORDER BY teacher_id, day_of_week, start_time
  LOOP
    debug_info := debug_info || 'Slot ID: ' || slot_record.id || 
                  ', Teacher: ' || slot_record.teacher_id || 
                  ', Day: "' || slot_record.day_of_week || '"' ||
                  ', Length: ' || slot_record.day_length || 
                  ', Time: ' || slot_record.start_time || '-' || slot_record.end_time || E'\n';
  END LOOP;
  
  -- Output the debug info
  RAISE NOTICE 'TIME SLOTS DEBUG INFO: %', debug_info;
  
  -- Check for trailing spaces
  FOR slot_record IN 
    SELECT 
      day_of_week,
      TRIM(day_of_week) as trimmed_day,
      CASE 
        WHEN day_of_week = TRIM(day_of_week) THEN 'No trailing spaces'
        ELSE 'Has trailing spaces'
      END as status,
      COUNT(*) as count
    FROM public.time_slots
    GROUP BY day_of_week, TRIM(day_of_week)
    ORDER BY day_of_week
  LOOP
    RAISE NOTICE 'Day: "%", Trimmed: "%", Status: %, Count: %', 
                 slot_record.day_of_week, 
                 slot_record.trimmed_day, 
                 slot_record.status, 
                 slot_record.count;
  END LOOP;
END
$$;