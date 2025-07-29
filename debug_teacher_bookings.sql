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