-- Debug script to test weekly session limits
-- Run this to check if the weekly session limits are working correctly

-- Test the get_week_details function
SELECT 'Current week details:' as test_name, * FROM get_week_details();
SELECT 'Tomorrow week details:' as test_name, * FROM get_week_details(CURRENT_DATE + 1);
SELECT 'Next Monday week details:' as test_name, * FROM get_week_details(DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days');

-- Sample test for a student (replace with actual student ID)
-- First, let's find a student ID to test with
SELECT 'Available students:' as info, id, student_name, sessions_per_week 
FROM students 
LIMIT 5;

-- You can run this query with an actual student ID:
-- SELECT 'Booking capacity test:' as test_name, validate_student_booking_capacity('STUDENT_ID_HERE', CURRENT_DATE);
-- SELECT 'Booking status test:' as test_name, * FROM get_student_booking_status('STUDENT_ID_HERE', CURRENT_DATE);

-- Check all current bookings for this week
SELECT 'This week bookings:' as info, 
       s.student_name,
       COUNT(b.id) as bookings_this_week,
       s.sessions_per_week,
       DATE_TRUNC('week', CURRENT_DATE) as week_start
FROM students s
LEFT JOIN bookings b ON s.id = b.student_id 
  AND b.booking_date >= DATE_TRUNC('week', CURRENT_DATE)
  AND b.booking_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
  AND b.status = 'confirmed'
GROUP BY s.id, s.student_name, s.sessions_per_week
ORDER BY s.student_name;