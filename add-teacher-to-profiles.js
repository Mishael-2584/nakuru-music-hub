import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://xtjarscgxhbyk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0amFyc2NneGhieWsiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzI5NzI5MCwiZXhwIjoyMDUyODczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addTeacherToProfiles() {
  try {
    console.log('🔍 Adding teacher to profiles table...');
    
    // Teacher details
    const teacherEmail = 'dakariswelgorithm@gmail.com';
    const teacherId = 'your-user-id-here'; // You'll need to get this from the auth.users table
    
    // First, let's check if the teacher already exists in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', teacherEmail)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking existing profile:', profileError);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ Teacher already has a profile:', existingProfile);
      
      // Update the role to teacher if it's not already
      if (existingProfile.role !== 'teacher') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'teacher' })
          .eq('email', teacherEmail);
        
        if (updateError) {
          console.error('❌ Error updating profile role:', updateError);
        } else {
          console.log('✅ Updated profile role to teacher');
        }
      } else {
        console.log('✅ Profile already has teacher role');
      }
    } else {
      console.log('❌ Teacher profile not found');
      console.log('⚠️  You need to get the user ID from auth.users table first');
      console.log('📝 To get the user ID, run this SQL in Supabase dashboard:');
      console.log(`SELECT id, email FROM auth.users WHERE email = '${teacherEmail}';`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTeacherToProfiles(); 