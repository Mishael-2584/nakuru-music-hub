// Quick debug script to run in browser console
// Copy and paste this into your browser console on the student dashboard page

async function quickDebugBooking() {
  console.log('🔍 Starting quick booking debug...');
  
  try {
    // Get the current student profile from the page context
    const studentProfileData = JSON.parse(localStorage.getItem('studentProfile') || '{}');
    console.log('👤 Student profile from localStorage:', studentProfileData);
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    
    // Test the supabase connection
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase not available. Make sure you\'re on the student dashboard page.');
      return;
    }
    
    // Get a student ID (you might need to replace this with your actual student ID)
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, student_name, sessions_per_week')
      .limit(1);
    
    if (studentsError) {
      console.error('❌ Error getting students:', studentsError);
      return;
    }
    
    if (!students || students.length === 0) {
      console.error('❌ No students found');
      return;
    }
    
    const studentId = students[0].id;
    console.log('🎯 Using student ID:', studentId, 'Name:', students[0].student_name);
    
    // Test week details function
    console.log('\\n📅 Testing get_week_details function...');
    const { data: weekDetails, error: weekError } = await supabase
      .rpc('get_week_details', { target_date: today });
    
    if (weekError) {
      console.error('❌ get_week_details error:', weekError);
    } else {
      console.log('✅ Week details:', weekDetails);
    }
    
    // Test booking status function
    console.log('\\n📊 Testing get_student_booking_status function...');
    const { data: bookingStatus, error: statusError } = await supabase
      .rpc('get_student_booking_status', { 
        student_id_param: studentId,
        booking_date_param: today
      });
    
    if (statusError) {
      console.error('❌ get_student_booking_status error:', statusError);
    } else {
      console.log('✅ Booking status:', bookingStatus);
    }
    
    // Test validation function
    console.log('\\n🛡️ Testing validate_student_booking_capacity function...');
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_student_booking_capacity', { 
        student_id_param: studentId,
        booking_date_param: today
      });
    
    if (validationError) {
      console.error('❌ validate_student_booking_capacity error:', validationError);
      console.log('📝 This might indicate the new migration was not applied properly');
    } else {
      console.log('✅ Validation result:', validation);
      
      if (!validation.can_book) {
        console.log('🚫 Cannot book because:', validation.reason);
        console.log('📊 Current bookings:', validation.current_bookings);
        console.log('📊 Total capacity:', validation.total_capacity);
        console.log('📊 Regular sessions:', validation.regular_sessions);
        console.log('🎫 Makeup credits:', validation.available_makeup_credits);
        console.log('📅 Week start:', validation.week_start);
        console.log('📅 Week end:', validation.week_end);
      } else {
        console.log('✅ Can book! Remaining slots:', validation.remaining_slots);
      }
    }
    
    // Check actual bookings in database
    console.log('\\n📚 Checking actual bookings in database...');
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    weekStart.setDate(diff);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    console.log('📅 Calculated week start:', weekStart.toISOString().split('T')[0]);
    console.log('📅 Calculated week end:', weekEnd.toISOString().split('T')[0]);
    
    const { data: actualBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .gte('booking_date', weekStart.toISOString().split('T')[0])
      .lte('booking_date', weekEnd.toISOString().split('T')[0])
      .in('status', ['confirmed', 'pending']);
    
    if (bookingsError) {
      console.error('❌ Error getting bookings:', bookingsError);
    } else {
      console.log('✅ Actual bookings this week:', actualBookings);
      console.log('📊 Booking count:', actualBookings?.length || 0);
      
      if (actualBookings && actualBookings.length > 0) {
        actualBookings.forEach((booking, index) => {
          console.log(`  ${index + 1}. ${booking.booking_date} ${booking.start_time}-${booking.end_time} (${booking.status})`);
        });
      }
    }
    
    // Check student sessions_per_week
    const { data: studentInfo, error: studentError } = await supabase
      .from('students')
      .select('sessions_per_week, student_name')
      .eq('id', studentId)
      .single();
    
    if (studentError) {
      console.error('❌ Error getting student info:', studentError);
    } else {
      console.log('✅ Student sessions per week:', studentInfo.sessions_per_week);
    }
    
    console.log('\\n🎯 SUMMARY:');
    console.log('- If you see function errors, the migration might not be applied');
    console.log('- If validation says can_book: false, check the reason');
    console.log('- Compare actual booking count vs sessions_per_week');
    console.log('- Week calculation should show current Monday-Sunday');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the function
console.log('🚀 Run quickDebugBooking() to debug your booking issue');
console.log('Or just run: quickDebugBooking()');

// Auto-run if you want
// quickDebugBooking();