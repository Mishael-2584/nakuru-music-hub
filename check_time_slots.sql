-- Check current time slots data
SELECT 
  id,
  teacher_id,
  day_of_week,
  LENGTH(day_of_week) as day_length,
  ASCII(SUBSTRING(day_of_week FROM LENGTH(day_of_week))) as last_char_ascii,
  start_time,
  end_time,
  is_available
FROM public.time_slots
ORDER BY teacher_id, day_of_week, start_time;

-- Check for any trailing spaces
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
ORDER BY day_of_week;