// Debug script to check booking validation issue
// Run this with: node debug_booking_issue.js

import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBookingValidation() {
  try {
    console.log('🔍 Debugging booking validation...');
    console.log('Current date:', new Date().toISOString().split('T')[0]);
    
    // First, let's get all students to test with
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, student_name, sessions_per_week')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
      return;
    }
    
    if (!students || students.length === 0) {
      console.log('❌ No students found');
      return;
    }
    
    console.log('👥 Found students:', students);
    
    // Test with the first student
    const testStudent = students[0];
    console.log('\n🎯 Testing with student:', testStudent);
    
    // Test the get_week_details function
    console.log('\n📅 Testing week details...');
    const { data: weekDetails, error: weekError } = await supabase
      .rpc('get_week_details', { target_date: new Date().toISOString().split('T')[0] });
    
    if (weekError) {
      console.error('❌ Error getting week details:', weekError);
    } else {
      console.log('✅ Week details:', weekDetails);
    }
    
    // Test the booking status function
    console.log('\n📊 Testing booking status...');
    const { data: bookingStatus, error: statusError } = await supabase
      .rpc('get_student_booking_status', { 
        student_id_param: testStudent.id,
        booking_date_param: new Date().toISOString().split('T')[0]
      });
    
    if (statusError) {
      console.error('❌ Error getting booking status:', statusError);
    } else {
      console.log('✅ Booking status:', bookingStatus);
    }
    
    // Test the validation function
    console.log('\n🛡️ Testing booking validation...');
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_student_booking_capacity', { 
        student_id_param: testStudent.id,
        booking_date_param: new Date().toISOString().split('T')[0]
      });
    
    if (validationError) {
      console.error('❌ Error in validation:', validationError);
    } else {
      console.log('✅ Validation result:', validation);
    }
    
    // Check current bookings for this week
    console.log('\n📚 Checking current bookings...');
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', testStudent.id)
      .gte('booking_date', weekStart.toISOString().split('T')[0])
      .lte('booking_date', weekEnd.toISOString().split('T')[0])
      .eq('status', 'confirmed');
    
    if (bookingsError) {
      console.error('❌ Error getting current bookings:', bookingsError);
    } else {
      console.log('✅ Current bookings for this week:', currentBookings);
      console.log('📊 Booking count:', currentBookings?.length || 0);
    }
    
    // Check makeup credits
    console.log('\n🎫 Checking makeup credits...');
    const { data: makeupCredits, error: creditsError } = await supabase
      .from('makeup_credits')
      .select('*')
      .eq('student_id', testStudent.id)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString().split('T')[0]);
    
    if (creditsError) {
      console.error('❌ Error getting makeup credits:', creditsError);
    } else {
      console.log('✅ Available makeup credits:', makeupCredits);
      console.log('📊 Credits count:', makeupCredits?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug function
debugBookingValidation();