import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// List of allowed origins - more permissive for hosted environments
const allowedOrigins = [
  'http://localhost:8080', // Vite dev server
  'http://localhost:8081', // Alternative Vite port
  'http://localhost:8082', // Alternative Vite port
  'http://localhost:5173', // Alternative Vite port
  'https://damonmusicacademy.co.ke', // Production domain
  'https://*.vercel.app', // Vercel deployments
  'https://*.netlify.app', // Netlify deployments
  'https://*.supabase.co', // Supabase domains
];

// Add production domain from environment variables if it exists.
const prodDomain = Deno.env.get('PRODUCTION_DOMAIN');
if (prodDomain) {
  allowedOrigins.push(prodDomain);
}

const siteUrl = Deno.env.get('PRODUCTION_DOMAIN') || 'https://damonmusicacademy.co.ke';
const logoUrl = `${siteUrl}/damon-logo.png`;

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  registration: any;
}

serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  
  // More permissive CORS for hosted environments
  const isAllowed = allowedOrigins.some(allowed => 
    origin === allowed || 
    allowed.includes('*') && origin.includes(allowed.replace('*', ''))
  );

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📧 Email function called from origin:', origin);
    console.log('📧 Request method:', req.method);
    console.log('📧 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const { to, subject, html }: EmailRequest = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    console.log('📧 Email request received:', { to, subject: subject.substring(0, 50) + '...' });
    console.log('📧 RESEND_API_KEY configured:', !!resendApiKey);

    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY is not configured');
      throw new Error('RESEND_API_KEY is not configured in Supabase secrets.');
    }

    const resendPayload = {
      from: 'Damon Music Academy <noreply@damonmusicacademy.co.ke>',
      to: [to],
      subject: subject,
      html: html.replace('{{LOGO_URL}}', logoUrl),
    };

    console.log('📧 Sending to Resend API...');
    console.log('📧 Resend payload:', { from: resendPayload.from, to: resendPayload.to, subject: resendPayload.subject });
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(resendPayload),
    });
    
    const responseText = await response.text();
    console.log('📧 Resend API response status:', response.status);
    console.log('📧 Resend API response:', responseText);

    if (!response.ok) {
      console.error('❌ Resend API error:', response.status, responseText);
      throw new Error(`Failed to send email. Status: ${response.status}. Body: ${responseText}`);
    }

    if (!responseText) {
      console.log('📧 Resend returned empty response, treating as success');
      const successResponse = { success: true, message: 'Email sent but Resend returned an empty response.' };
      return new Response(JSON.stringify(successResponse), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      });
    }
    
    const result = JSON.parse(responseText);
    console.log('📧 Resend API success result:', result);
    const successResult = { success: true, message: 'Email sent successfully', id: result.id };

    return new Response(JSON.stringify(successResult), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (error) {
    console.error('❌ Email function error:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Option 2: Using SendGrid (alternative)
/*
import sgMail from '@sendgrid/mail'

serve(async (req) => {
  try {
    const { to, subject, html, registration }: EmailRequest = await req.json()
    
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    
    if (!sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY not configured')
    }

    sgMail.setApiKey(sendgridApiKey)

    await sgMail.send({
      to: to,
      from: 'noreply@damonmusicacademy.com',
      subject: subject,
      html: html,
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
*/

// Option 3: Using Nodemailer with SMTP (if you have your own SMTP server)
/*
import { createTransport } from 'nodemailer'

serve(async (req) => {
  try {
    const { to, subject, html, registration }: EmailRequest = await req.json()
    
    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASS'),
      },
    })

    await transporter.sendMail({
      from: 'Damon Music Academy <noreply@damonmusicacademy.com>',
      to: to,
      subject: subject,
      html: html,
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
*/ 