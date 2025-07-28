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
    console.log('🔧 Teacher Edge Function started');
    const { email, name, password, action } = await req.json();
    console.log('🔧 Received data:', {
      email,
      name,
      action
    });

    if (!email || !name) {
      console.log('❌ Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing email or name'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

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

    // If action is 'get_password', try to get existing user and generate new password
    if (action === 'get_password') {
      console.log('🔧 Getting password for existing teacher user');
      
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.log('❌ Error listing users:', userError.message);
        return new Response(JSON.stringify({
          error: 'Could not check existing users'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      const user = existingUser.users.find(u => u.email === email);
      
      if (user) {
        console.log('✅ Found existing teacher user, generating new password');
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        
        // Update the user's password
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password: tempPassword
        });

        if (updateError) {
          console.log('❌ Error updating password:', updateError.message);
          return new Response(JSON.stringify({
            error: 'Could not update password'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        console.log('✅ Password updated successfully');
        return new Response(JSON.stringify({
          tempPassword
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log('❌ Teacher user not found');
        return new Response(JSON.stringify({
          error: 'Teacher user not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // Create new teacher user
    console.log('🔧 Creating new teacher user');
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: password, // Use the password provided by the teacher during signup
      email_confirm: true,
      user_metadata: {
        name,
        role: 'teacher'
      }
    });

    if (createError) {
      console.log('❌ Error creating teacher user:', createError.message);
      return new Response(JSON.stringify({
        error: createError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('✅ Teacher user created successfully');
    return new Response(JSON.stringify({
      userId: userData.user.id,
      tempPassword: undefined // Explicitly undefined as per user request
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}); 