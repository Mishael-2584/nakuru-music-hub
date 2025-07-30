-- Debug script to check teacher bookings access
-- Run this in Supabase SQL editor to see what's happening

-- 1. Check all teachers and their user_id mappings
SELECT 
  t.id as teacher_id,
  t.name as teacher_name,
  t.email as teacher_email,
  t.user_id as teacher_user_id,
  au.id as auth_user_id,
  au.email as auth_email
FROM public.teachers t
LEFT JOIN auth.users au ON t.user_id = au.id
ORDER BY t.name;

-- 2. Check all bookings and their teacher assignments
SELECT 
  b.id as booking_id,
  b.teacher_id,
  b.student_id,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.status,
  t.name as teacher_name,
  t.email as teacher_email,
  s.student_name,
  s.email as student_email
FROM public.bookings b
LEFT JOIN public.teachers t ON b.teacher_id = t.id
LEFT JOIN public.students s ON b.student_id = s.id
ORDER BY b.booking_date DESC, b.start_time;

-- 3. Check RLS policies on bookings table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings';

-- 4. Test the debug function for a specific teacher (replace with actual teacher email)
-- SELECT * FROM debug_teacher_bookings_access();

-- 5. Check if there are any bookings without proper teacher assignments
SELECT 
  b.id,
  b.teacher_id,
  b.student_id,
  b.booking_date,
  t.name as teacher_name,
  t.email as teacher_email
FROM public.bookings b
LEFT JOIN public.teachers t ON b.teacher_id = t.id
WHERE t.id IS NULL OR t.user_id IS NULL;

-- 6. Check time_slots and their availability
SELECT 
  ts.id,
  ts.teacher_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  ts.is_available,
  t.name as teacher_name,
  t.email as teacher_email
FROM public.time_slots ts
LEFT JOIN public.teachers t ON ts.teacher_id = t.id
ORDER BY t.name, ts.day_of_week, ts.start_time;

-- 7. Check if booked slots are properly marked as unavailable
SELECT 
  ts.id as slot_id,
  ts.teacher_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  ts.is_available,
  b.id as booking_id,
  b.booking_date,
  b.status as booking_status,
  s.student_name
FROM public.time_slots ts
LEFT JOIN public.bookings b ON ts.teacher_id = b.teacher_id 
  AND ts.day_of_week = TO_CHAR(b.booking_date::date, 'Day')
  AND ts.start_time = b.start_time
LEFT JOIN public.students s ON b.student_id = s.id
WHERE ts.is_available = true
ORDER BY ts.teacher_id, ts.day_of_week, ts.start_time;