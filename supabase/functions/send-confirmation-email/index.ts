import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// List of allowed origins.
const allowedOrigins = [
  'http://localhost:8080', // Vite dev server
  'http://localhost:5173', // Alternative Vite port
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
  const isAllowed = allowedOrigins.includes(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json();
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured in Supabase secrets.');
    }

    const resendPayload = {
      from: 'Damon Music Academy <noreply@damonmusicacademy.co.ke>',
      to: [to],
      subject: subject,
      html: html.replace('{{LOGO_URL}}', logoUrl),
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(resendPayload),
    });
    
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to send email. Status: ${response.status}. Body: ${responseText}`);
    }

    if (!responseText) {
      const successResponse = { success: true, message: 'Email sent but Resend returned an empty response.' };
      return new Response(JSON.stringify(successResponse), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      });
    }
    
    const result = JSON.parse(responseText);
    const successResult = { success: true, message: 'Email sent successfully', id: result.id };

    return new Response(JSON.stringify(successResult), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 200 
    });

  } catch (error) {
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