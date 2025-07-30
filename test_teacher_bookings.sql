-- Test script to check teacher bookings access
-- Run this in Supabase SQL editor to debug the issue

-- 1. Check current teacher's auth user
SELECT 
  auth.uid() as current_auth_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- 2. Check if teacher exists and their user_id mapping
SELECT 
  t.id as teacher_id,
  t.name as teacher_name,
  t.email as teacher_email,
  t.user_id as teacher_user_id,
  CASE 
    WHEN t.user_id = auth.uid() THEN 'MATCHED'
    WHEN t.email = (SELECT email FROM auth.users WHERE id = auth.uid()) THEN 'EMAIL_MATCH'
    ELSE 'NO_MATCH'
  END as auth_status
FROM public.teachers t
WHERE t.user_id = auth.uid() 
   OR t.email = (SELECT email FROM auth.users WHERE id = auth.uid());

-- 3. Check all bookings for this teacher (by user_id)
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
WHERE t.user_id = auth.uid()
ORDER BY b.booking_date DESC, b.start_time;

-- 4. Check all bookings for this teacher (by email)
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
WHERE t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
ORDER BY b.booking_date DESC, b.start_time;

-- 5. Check RLS policies on bookings table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- 6. Test the RLS policy directly
SELECT 
  'Testing RLS policy' as test_type,
  COUNT(*) as accessible_bookings
FROM public.bookings b
WHERE teacher_id IN (
  SELECT id FROM public.teachers 
  WHERE user_id = auth.uid()
);

-- 7. Check if there are any bookings at all
SELECT 
  'All bookings count' as info,
  COUNT(*) as total_bookings
FROM public.bookings;

-- 8. Check teacher's time slots
SELECT 
  ts.id,
  ts.teacher_id,
  ts.day_of_week,
  ts.start_time,
  ts.end_time,
  ts.is_available,
  t.name as teacher_name
FROM public.time_slots ts
LEFT JOIN public.teachers t ON ts.teacher_id = t.id
WHERE t.user_id = auth.uid()
ORDER BY ts.day_of_week, ts.start_time; 