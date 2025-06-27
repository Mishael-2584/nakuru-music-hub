import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    console.log('🔧 Edge Function started');
    const { email, student_name } = await req.json();
    console.log('🔧 Received data:', {
      email,
      student_name
    });

    if (!email || !student_name) {
      console.log('❌ Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing email or student_name'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    console.log('🔧 Generated temp password');

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: serviceRoleKey?.length || 0
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.log('❌ Missing environment variables');
      return new Response(JSON.stringify({
        error: 'Missing environment variables'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log('🔧 Supabase client created');

    // Try to create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        student_name
      }
    });

    console.log('🔧 Auth result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message
    });

    if (error) {
      // Check if it's a duplicate email error
      if (error.message.includes('already been registered')) {
        console.log('✅ User already exists, returning success');
        return new Response(JSON.stringify({
          tempPassword: 'EXISTING_USER',
          message: 'User already exists in the system'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log('❌ Auth error:', error.message);
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ User created successfully');

    // Update the students table with the user_id
    if (data.user) {
      console.log('🔧 Updating students table with user_id:', data.user.id);
      
      // First, check if a student record exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.log('⚠️ Error checking for existing student:', checkError.message);
      }

      if (!existingStudent) {
        console.log('🔧 No existing student record found, creating one from registration...');
        
        // Get the registration data to create the student record
        const { data: registration, error: regError } = await supabase
          .from('registrations')
          .select('*')
          .eq('email', email)
          .eq('status', 'approved')
          .single();

        if (regError) {
          console.log('⚠️ Could not find approved registration:', regError.message);
        } else if (registration) {
          // Create the student record
          const { error: createError } = await supabase
            .from('students')
            .insert({
              user_id: data.user.id,
              registration_id: registration.id,
              student_name: registration.student_name,
              age: registration.age,
              email: registration.email,
              phone: registration.phone,
              country_code: registration.country_code,
              parent_name: registration.parent_name,
              parent_phone: registration.parent_phone,
              instrument: registration.instrument,
              experience: registration.experience,
              proficiency_level: registration.proficiency_level,
              learning_mode: registration.learning_mode,
              owns_instrument: registration.owns_instrument,
              location: registration.location,
              medical_condition: registration.medical_condition,
              medical_details: registration.medical_details,
              goals: registration.goals,
              preferred_schedule: registration.preferred_schedule,
              status: 'active'
            });

          if (createError) {
            console.log('⚠️ Could not create student record:', createError.message);
          } else {
            console.log('✅ Successfully created student record');
          }
        }
      } else {
        // Update existing student record with user_id
        const { error: updateError } = await supabase
          .from('students')
          .update({ user_id: data.user.id })
          .eq('email', email);

        if (updateError) {
          console.log('⚠️ Warning: Could not update students table:', updateError.message);
        } else {
          console.log('✅ Successfully updated students table with user_id');
        }
      }
    }

    console.log('✅ User created successfully');
    return new Response(JSON.stringify({
      tempPassword
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    return new Response(JSON.stringify({
      error: `Unexpected error: ${err.message}`
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 