import { supabase } from '@/integrations/supabase/client';
import { generateQuotePDF } from "./pdfGenerator";

interface RegistrationData {
  id: string;
  receipt_number: string;
  student_name: string;
  age: number;
  email: string;
  phone: string;
  country_code: string;
  parent_name?: string;
  parent_phone?: string;
  course_category: string;
  instrument: string;
  production_type?: string;
  experience: string;
  proficiency_level: string;
  learning_mode: string;
  owns_instrument: boolean;
  location: string;
  medical_condition: string;
  medical_details?: string;
  goals?: string;
  preferred_schedule?: string;
  status: string;
  created_at: string;
}

export const sendConfirmationEmail = async (registration: RegistrationData): Promise<boolean> => {
  try {
    console.log('📧 Sending confirmation email to:', registration.email);

    // Validate required fields
    if (!registration.id || !registration.receipt_number || !registration.student_name || !registration.email || !registration.created_at) {
      console.error('❌ Missing required fields for email');
      return false;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const siteUrl = 'https://damonmusicacademy.co.ke';
    const logoUrl = `${siteUrl}/damon-logo.png`;

    // Dynamic intro message based on course_category
    let introMessage = '';
    if (registration.course_category === 'Music') {
      introMessage = "Thank you for choosing us for your creative journey!";
    } else if (registration.course_category === 'Art') {
      introMessage = "Thank you for choosing us to explore your artistic talents!";
    } else if (registration.course_category === 'Production') {
      introMessage = "Thank you for choosing us to advance your production skills!";
    } else {
      introMessage = "Thank you for choosing Damon Music Academy!";
    }

    // Create HTML email content
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation - Damon Music Academy</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .receipt-header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
          }
          .receipt-number {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
          }
          .section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
          }
          .info-label {
            font-weight: 600;
            color: #6c757d;
          }
          .info-value {
            color: #495057;
          }
          .status-badge {
            background: #28a745;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .next-steps {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #28a745;
          }
          .contact-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            border-left: 4px solid #2196f3;
          }
          .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .info-grid, .contact-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="{{LOGO_URL}}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
          <h1>🎵 Damon Music Academy</h1>
          <h2>Registration Confirmation</h2>
          <p>${introMessage}</p>
        </div>
        
        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #: ${registration.receipt_number}</div>
            <div>Registration Date: ${formatDate(registration.created_at)}</div>
            <div class="status-badge">${registration.status.toUpperCase()}</div>
          </div>

          <div class="section">
            <div class="section-title">👤 Student Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${registration.student_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span>
                <span class="info-value">${registration.age} years</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${registration.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${registration.country_code} ${registration.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value">${registration.location}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🎓 Course Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Course Category:</span>
                <span class="info-value">${registration.course_category}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Subject/Instrument:</span>
                <span class="info-value">${(() => {
                  if (registration.course_category === 'Music') return registration.instrument;
                  if (registration.course_category === 'Production') return registration.production_type;
                  return 'Art Course';
                })()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Proficiency Level:</span>
                <span class="info-value">${registration.proficiency_level}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Learning Mode:</span>
                <span class="info-value">${registration.learning_mode}</span>
              </div>
              ${registration.course_category === 'Music' ? `
              <div class="info-item">
                <span class="info-label">Owns Instrument:</span>
                <span class="info-value">${registration.owns_instrument ? 'Yes' : 'No'}</span>
              </div>
              ` : ''}
              ${registration.preferred_schedule ? `
              <div class="info-item">
                <span class="info-label">Preferred Schedule:</span>
                <span class="info-value">${registration.preferred_schedule}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${registration.parent_name ? `
          <div class="section">
            <div class="section-title">👨‍👩‍👧‍👦 Parent/Guardian Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${registration.parent_name}</span>
              </div>
              ${registration.parent_phone ? `
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${registration.parent_phone}</span>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${registration.medical_condition === 'yes' ? `
          <div class="section">
            <div class="section-title">🏥 Medical Information</div>
            <div class="info-item">
              <span class="info-label">Medical Conditions:</span>
              <span class="info-value">Yes</span>
            </div>
            <div class="info-item">
              <span class="info-label">Details:</span>
              <span class="info-value">${registration.medical_details}</span>
            </div>
          </div>
          ` : ''}

          ${registration.goals ? `
          <div class="section">
            <div class="section-title">🎯 Learning Goals</div>
            <p>${registration.goals}</p>
          </div>
          ` : ''}

          <div class="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
              <li>We'll review your application and contact you within <strong>24-48 hours</strong> to confirm your enrollment.</li>
              <li>Please keep this receipt number (<strong>${registration.receipt_number}</strong>) for your records.</li>
              <li>You can track your application status using your email address.</li>
              <li>If you have any questions, feel free to contact us using the information below.</li>
            </ul>
          </div>

          <div class="contact-info">
            <h3>📞 Need Help? Contact Us</h3>
            <div class="contact-grid">
              <div class="info-item">
                <span class="info-label">📱 Phone:</span>
                <span class="info-value">+254 701 195 460 / +254 713 490 535</span>
              </div>
              <div class="info-item">
                <span class="info-label">📧 Email:</span>
                <span class="info-value">info@damonmusicacademy.com</span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 Address:</span>
                <span class="info-value">Nakuru, Kenya</span>
              </div>
              <div class="info-item">
                <span class="info-label">🕒 Hours:</span>
                <span class="info-value">Sun: 8am-6pm, Mon-Fri: 7am-6pm (Academy)</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Damon Music Academy!</p>
            <p>We look forward to helping you achieve your creative dreams.</p>
            <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Call the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: registration.email,
        subject: `Registration Confirmation - ${registration.receipt_number} | Damon Music Academy`,
        html: emailHTML,
        registration: registration
      }
    });

    if (error) {
      console.error('❌ Email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Confirmation email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send confirmation email:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return false;
  }
};

export const testEmailService = async (): Promise<boolean> => {
  try {
    console.log('🧪 Starting email service test...');
    
    // Test Supabase connection first
    console.log('🧪 Testing Supabase connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🧪 Auth test result:', { user: !!user, error: authError });
    
    const testRegistration = {
      id: 'test-123',
      receipt_number: 'TEST-001',
      student_name: 'Test Student',
      age: 15,
      email: 'test@example.com',
      phone: '123456789',
      country_code: '+254',
      parent_name: 'Test Parent',
      parent_phone: '987654321',
      course_category: 'Music',
      instrument: 'Piano',
      production_type: null,
      experience: 'beginner',
      proficiency_level: 'beginner',
      learning_mode: 'in-person',
      owns_instrument: true,
      location: 'Nakuru',
      medical_condition: 'no',
      medical_details: null,
      goals: 'Learn to play piano',
      preferred_schedule: 'Weekends',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log('🧪 Test registration data:', testRegistration);
    console.log('🧪 Calling sendConfirmationEmail...');
    
    const result = await sendConfirmationEmail(testRegistration);
    console.log('🧪 Email service test result:', result);
    return result;
  } catch (error) {
    console.error('🧪 Email service test failed:', error);
    console.error('🧪 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Add a simple test function that can be called from browser console
export const quickEmailTest = async (testEmail: string = 'mishaelgebre@gmail.com'): Promise<void> => {
  console.log('🧪 Quick email test starting...');
  console.log('🧪 Sending test email to:', testEmail);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: testEmail,
        subject: 'Test Email - Damon Music Academy',
        html: '<h1>Test Email</h1><p>This is a test email from Damon Music Academy.</p><p>If you receive this, the email service is working correctly!</p>',
        registration: { id: 'test', receipt_number: 'TEST-001' }
      }
    });
    
    console.log('🧪 Quick test result:', { data, error });
    
    if (error) {
      console.error('❌ Quick test failed:', error);
    } else if (data?.success) {
      console.log('✅ Quick test successful! Check your email at:', testEmail);
    } else {
      console.error('❌ Quick test failed:', data);
    }
  } catch (err) {
    console.error('❌ Quick test error:', err);
  }
};

// Add a comprehensive test function that sends a full registration email
export const testFullRegistrationEmail = async (): Promise<void> => {
  console.log('🧪 Testing full registration email...');
  
  const testRegistration = {
    id: 'test-123',
    receipt_number: 'DMA-2024-00001',
    student_name: 'Test Student',
    age: 15,
    email: 'mishaelgebre@gmail.com',
    phone: '123456789',
    country_code: '+254',
    parent_name: 'Test Parent',
    parent_phone: '987654321',
    course_category: 'Music',
    instrument: 'Piano',
    production_type: null,
    experience: 'beginner',
    proficiency_level: 'beginner',
    learning_mode: 'in-person',
    owns_instrument: true,
    location: 'Nakuru',
    medical_condition: 'no',
    medical_details: null,
    goals: 'Learn to play piano',
    preferred_schedule: 'Weekends',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  try {
    console.log('🧪 Test registration data:', testRegistration);
    console.log('🧪 Sending full registration email to:', testRegistration.email);
    console.log('🧪 Calling sendConfirmationEmail function...');
    
    const result = await sendConfirmationEmail(testRegistration);
    console.log('🧪 sendConfirmationEmail returned:', result);
    
    if (result) {
      console.log('✅ Full registration email sent successfully!');
      console.log('📧 Check your email at:', testRegistration.email);
      console.log('📧 Receipt number:', testRegistration.receipt_number);
    } else {
      console.error('❌ Full registration email failed - sendConfirmationEmail returned false');
    }
  } catch (error) {
    console.error('❌ Full registration email error:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
};

export const sendAcceptedEmail = async (registration: RegistrationData, tempPassword?: string | null): Promise<boolean> => {
  try {
    console.log('📧 Sending acceptance email to:', registration.email);

    if (!registration.id || !registration.receipt_number || !registration.student_name || !registration.email || !registration.created_at) {
      console.error('❌ Missing required fields for acceptance email');
      return false;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const siteUrl = 'https://damonmusicacademy.co.ke';
    const logoUrl = `${siteUrl}/damon-logo.png`;

    // Create HTML email content for acceptance
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enrollment Confirmed - Damon Music Academy</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
          .header { background: linear-gradient(135deg, #28a745 0%, #00c6ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .receipt-header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745; }
          .receipt-number { font-size: 18px; font-weight: bold; color: #28a745; }
          .section { margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .section-title { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
          .info-label { font-weight: 600; color: #6c757d; }
          .info-value { color: #495057; }
          .status-badge { background: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .next-steps { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745; }
          .login-credentials { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
          .payment-notice { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107; }
          .contact-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #2196f3; }
          .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          @media (max-width: 600px) { .info-grid, .contact-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="{{LOGO_URL}}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
          <h1>🎉 Congratulations, ${registration.student_name}!</h1>
          <h2>Your Application is Successful!</h2>
          <p>Welcome to Damon Music Academy! Your application has been <strong>approved</strong> and you are now ready to begin your creative journey.</p>
        </div>
        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #: ${registration.receipt_number}</div>
            <div>Application Date: ${formatDate(registration.created_at)}</div>
            <div class="status-badge">APPROVED</div>
          </div>
          <div class="section">
            <div class="section-title">👤 Student Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Full Name:</span><span class="info-value">${registration.student_name}</span></div>
              <div class="info-item"><span class="info-label">Age:</span><span class="info-value">${registration.age} years</span></div>
              <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${registration.email}</span></div>
              <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${registration.country_code} ${registration.phone}</span></div>
              <div class="info-item"><span class="info-label">Location:</span><span class="info-value">${registration.location}</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">🎓 Course Details</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Course Category:</span><span class="info-value">${registration.course_category}</span></div>
              <div class="info-item"><span class="info-label">Subject/Instrument:</span><span class="info-value">${(() => {
                if (registration.course_category === 'Music') return registration.instrument;
                if (registration.course_category === 'Production') return registration.production_type;
                return 'Art Course';
              })()}</span></div>
              <div class="info-item"><span class="info-label">Proficiency Level:</span><span class="info-value">${registration.proficiency_level}</span></div>
              <div class="info-item"><span class="info-label">Learning Mode:</span><span class="info-value">${registration.learning_mode}</span></div>
              ${registration.course_category === 'Music' ? `<div class="info-item"><span class="info-label">Owns Instrument:</span><span class="info-value">${registration.owns_instrument ? 'Yes' : 'No'}</span></div>` : ''}
              ${registration.preferred_schedule ? `<div class="info-item"><span class="info-label">Preferred Schedule:</span><span class="info-value">${registration.preferred_schedule}</span></div>` : ''}
            </div>
          </div>
          ${registration.parent_name ? `<div class="section"><div class="section-title">👨‍👩‍👧‍👦 Parent/Guardian Information</div><div class="info-grid"><div class="info-item"><span class="info-label">Name:</span><span class="info-value">${registration.parent_name}</span></div>${registration.parent_phone ? `<div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${registration.parent_phone}</span></div>` : ''}</div></div>` : ''}
          ${registration.medical_condition === 'yes' ? `<div class="section"><div class="section-title">🏥 Medical Information</div><div class="info-item"><span class="info-label">Medical Conditions:</span><span class="info-value">Yes</span></div><div class="info-item"><span class="info-label">Details:</span><span class="info-value">${registration.medical_details}</span></div></div>` : ''}
          
          <div class="payment-notice">
            <h3>💰 Payment Required to Secure Your Spot</h3>
            <p><strong>Important:</strong> We have sent you an invoice that includes:</p>
            <ul>
              <li><strong>One-time enrollment fee:</strong> 800 KSh (non-refundable)</li>
              <li><strong>First month's tuition:</strong> Based on your selected course and sessions</li>
              <li><strong>Total due:</strong> Enrollment fee + Tuition</li>
            </ul>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>Next Step:</strong> Please check your email for the invoice and complete payment to finalize your enrollment and secure your spot in our program.
            </p>
          </div>
          
          <div class="next-steps">
            <h3>✅ Next Steps</h3>
            <ul>
              <li><strong>Complete payment</strong> using the invoice we sent you to secure your enrollment.</li>
              <li>Once payment is confirmed, you will receive a final enrollment confirmation email with your student portal login credentials.</li>
              <li>If you have any questions about payment or enrollment, feel free to reply to this email or contact us using the information below.</li>
              <li>We look forward to seeing you at Damon Music Academy!</li>
            </ul>
          </div>
          <div class="contact-info">
            <h3>📞 Need Help? Contact Us</h3>
            <div class="contact-grid">
              <div class="info-item"><span class="info-label">📱 Phone:</span><span class="info-value">+254 701 195 460 / +254 713 490 535</span></div>
              <div class="info-item"><span class="info-label">📧 Email:</span><span class="info-value">info@damonmusicacademy.com</span></div>
              <div class="info-item"><span class="info-label">📍 Address:</span><span class="info-value">Nakuru, Kenya</span></div>
              <div class="info-item"><span class="info-label">🕒 Hours:</span><span class="info-value">Sun: 8am-6pm, Mon-Fri: 7am-6pm (Academy)</span></div>
            </div>
          </div>
          <div class="footer">
            <p>Welcome to the Damon Music Academy family!</p>
            <p>We are excited to help you achieve your creative dreams.</p>
            <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: registration.email,
        subject: `Enrollment Confirmed - ${registration.receipt_number} | Damon Music Academy`,
        html: emailHTML,
        registration: registration
      }
    });

    if (error) {
      console.error('❌ Acceptance email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Acceptance email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send acceptance email:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending acceptance email:', error);
    return false;
  }
};

export const sendDeclinedEmail = async (registration: RegistrationData): Promise<boolean> => {
  try {
    console.log('📧 Sending declined email to:', registration.email);

    if (!registration.id || !registration.receipt_number || !registration.student_name || !registration.email || !registration.created_at) {
      console.error('❌ Missing required fields for declined email');
      return false;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const siteUrl = 'https://damonmusicacademy.co.ke';
    const logoUrl = `${siteUrl}/damon-logo.png`;

    // Create HTML email content for declined application
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Update - Damon Music Academy</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
          .header { background: linear-gradient(135deg, #ff5858 0%, #f09819 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .receipt-header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ff5858; }
          .receipt-number { font-size: 18px; font-weight: bold; color: #ff5858; }
          .section { margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .section-title { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 15px; border-bottom: 2px solid #ff5858; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
          .info-label { font-weight: 600; color: #6c757d; }
          .info-value { color: #495057; }
          .status-badge { background: #ff5858; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          @media (max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="{{LOGO_URL}}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
          <h1>Application Update</h1>
          <h2>Dear ${registration.student_name},</h2>
          <p>Thank you for your interest in Damon Music Academy. We appreciate the time and effort you put into your application.</p>
        </div>
        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #: ${registration.receipt_number}</div>
            <div>Application Date: ${formatDate(registration.created_at)}</div>
            <div class="status-badge">DECLINED</div>
          </div>
          <div class="section">
            <div class="section-title">Application Status</div>
            <p>We regret to inform you that your application was not successful at this time. This decision was not easy, and we encourage you to apply again in the future or reach out to us for feedback or alternative opportunities.</p>
            <p>If you have any questions or would like to discuss your application, please feel free to contact us using the information below.</p>
          </div>
          <div class="footer">
            <p>Thank you again for your interest in Damon Music Academy.</p>
            <p>We wish you all the best in your creative journey!</p>
            <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: registration.email,
        subject: `Application Update - ${registration.receipt_number} | Damon Music Academy`,
        html: emailHTML,
        registration: registration
      }
    });

    if (error) {
      console.error('❌ Declined email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Declined email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send declined email:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending declined email:', error);
    return false;
  }
};

export const sendTeacherAcceptedEmail = async (teacher, tempPassword?: string) => {
  const siteUrl = 'https://damonmusicacademy.co.ke';
  const logoUrl = `${siteUrl}/damon-logo.png`;
  
  // Create login credentials section
  const loginCredentialsSection = tempPassword ? `
    <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
      <h3 style="color: #1976d2; margin-top: 0;">🔐 Your Login Credentials</h3>
      <p><strong>Login URL:</strong> <a href="https://damonmusicacademy.co.ke/auth" style="color: #1976d2;">https://damonmusicacademy.co.ke/auth</a></p>
      <p><strong>Email:</strong> ${teacher.email}</p>
      <p><strong>Password:</strong> ${tempPassword}</p>
      <p style="font-size: 14px; color: #666; margin-top: 15px;">
        <strong>Important:</strong> This is the password you created during signup. You can change it after your first login for security.
      </p>
    </div>
  ` : '';

  const emailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teacher Application Approved - Damon Music Academy</title>
      <style>
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f8f9fa;}
        .header{background:linear-gradient(135deg,#28a745 0%,#00c6ff 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}
        .content{background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}
        .next-steps{background:linear-gradient(135deg,#d4edda 0%,#c3e6cb 100%);padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #28a745;}
        .contact-info{background:#e3f2fd;padding:20px;border-radius:8px;margin-top:25px;border-left:4px solid #2196f3;}
        .footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;color:#6c757d;font-size:14px;}
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
        <h1>🎉 Congratulations, ${teacher.name}!</h1>
        <h2>Your Teacher Application is Approved</h2>
      </div>
      <div class="content">
        <p>Dear ${teacher.name},</p>
        <p>We are pleased to inform you that your application to become a teacher at Damon Music Academy has been <strong>approved</strong>!</p>
        
        ${loginCredentialsSection}
        
        <div class="next-steps">
          <h3>✅ Next Steps</h3>
          <ul>
            <li><strong>Log in to your teacher portal</strong> using the credentials above</li>
            <li><strong>Set up your availability</strong> by adding your time slots</li>
            <li><strong>Update your profile</strong> with your teaching preferences</li>
            <li><strong>Start managing your students</strong> and lesson schedules</li>
          </ul>
        </div>
        
        <div class="contact-info">
          <h3>📞 Need Help? Contact Us</h3>
          <p><strong>Phone:</strong> +254 701 195 460 / +254 713 490 535</p>
          <p><strong>Email:</strong> <a href="mailto:info@damonmusicacademy.com">info@damonmusicacademy.com</a></p>
          <p><strong>Address:</strong> Nakuru, Kenya</p>
        </div>
        
        <div class="footer">
          <p>Welcome to the Damon Music Academy team!</p>
          <p>We look forward to working with you to inspire the next generation of musicians and artists.</p>
          <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: teacher.email,
      subject: `Teacher Application Approved | Damon Music Academy`,
      html: emailHTML,
      registration: teacher
    }
  });
  if (error) {
    console.error('❌ Teacher approval email error:', error);
    return false;
  }
  return data && data.success;
};

export const sendTeacherDeclinedEmail = async (teacher) => {
  const siteUrl = 'https://damonmusicacademy.co.ke';
  const logoUrl = `${siteUrl}/damon-logo.png`;
  const emailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Teacher Application Update - Damon Music Academy</title>
      <style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f8f9fa;}.header{background:linear-gradient(135deg,#ff5858 0%,#f09819 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}.content{background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;color:#6c757d;font-size:14px;}</style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
        <h1>Teacher Application Update</h1>
      </div>
      <div class="content">
        <p>Dear ${teacher.name},</p>
        <p>Thank you for your interest in joining Damon Music Academy. After careful review, we regret to inform you that your application was not successful at this time.</p>
        <p>If you have any questions or would like feedback, please contact us at <a href="mailto:info@damonmusicacademy.com">info@damonmusicacademy.com</a>.</p>
        <div class="footer">
          <p>Thank you again for your interest in Damon Music Academy.</p>
          <p>We wish you all the best in your teaching journey!</p>
          <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: teacher.email,
      subject: `Teacher Application Update | Damon Music Academy`,
      html: emailHTML,
      registration: teacher
    }
  });
  if (error) {
    console.error('❌ Teacher declined email error:', error);
    return false;
  }
  return data && data.success;
};

export const sendTeacherRequestInfoEmail = async (teacher, message) => {
  const siteUrl = 'https://damonmusicacademy.co.ke';
  const logoUrl = `${siteUrl}/damon-logo.png`;
  const emailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>More Information Needed - Damon Music Academy</title>
      <style>body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f8f9fa;}.header{background:linear-gradient(135deg,#ffc107 0%,#ff9800 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;}.content{background:white;padding:30px;border-radius:0 0 10px 10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;color:#6c757d;font-size:14px;}</style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
        <h1>More Information Needed</h1>
      </div>
      <div class="content">
        <p>Dear ${teacher.name},</p>
        <p>Thank you for your application to become a teacher at Damon Music Academy. We need more information to process your application:</p>
        <blockquote style="background:#f9f9f9;padding:15px;border-left:4px solid #ffc107;margin:20px 0;">${message}</blockquote>
        <p>Please send the requested documents or details to <a href="mailto:info@damonmusicacademy.com">info@damonmusicacademy.com</a>.</p>
        <div class="footer">
          <p>If you have any questions, reply to this email or contact us at info@damonmusicacademy.com.</p>
          <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: teacher.email,
      subject: `More Information Needed | Damon Music Academy`,
      html: emailHTML,
      registration: teacher
    }
  });
  if (error) {
    console.error('❌ Teacher request info email error:', error);
    return false;
  }
  return data && data.success;
};

export const sendQuoteEmail = async (quoteData: any, quoteAmount: number, adminNotes?: string, invoiceDetails?: any) => {
  try {
    // Generate PDF
    const pdfBlob = await generateQuotePDF(quoteData, quoteAmount, adminNotes, invoiceDetails);
    
    // Convert blob to base64 for email attachment
    const reader = new FileReader();
    const pdfBase64 = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });

    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: quoteData.email,
        subject: `Your Quote for ${quoteData.service_category} - Damon Music Academy`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://damonmusicacademy.co.ke/damon-logo.png" alt="Damon Music Academy" style="height: 60px;">
              <h1 style="color: #333; margin-top: 20px;">Your Quote is Ready!</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-bottom: 20px;">Quote Details</h2>
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">Service Requested</h3>
                <p style="color: #666; margin: 5px 0;"><strong>Service:</strong> ${quoteData.service_category}</p>
                ${quoteData.project_type ? `<p style="color: #666; margin: 5px 0;"><strong>Project Type:</strong> ${quoteData.project_type}</p>` : ''}
                ${quoteData.event_date ? `<p style="color: #666; margin: 5px 0;"><strong>Event Date:</strong> ${quoteData.event_date}</p>` : ''}
                ${quoteData.location ? `<p style="color: #666; margin: 5px 0;"><strong>Location:</strong> ${quoteData.location}</p>` : ''}
              </div>
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">Quote Amount</h3>
                <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                  <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 0;">
                    KES ${quoteAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              ${adminNotes ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="color: #333; margin-bottom: 10px;">Additional Notes</h3>
                  <p style="color: #666; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">${adminNotes}</p>
                </div>
              ` : ''}
              
              <div style="margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">Next Steps</h3>
                <ol style="color: #666; padding-left: 20px;">
                  <li>Review the quote details above</li>
                  <li>Download the attached PDF for your records</li>
                  <li>Contact us to confirm your acceptance</li>
                  <li>We'll schedule your project and begin work</li>
                </ol>
              </div>
              
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #2563eb; margin-bottom: 10px;">Contact Information</h3>
                <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> admin@damonmusicacademy.co.ke</p>
                <p style="color: #666; margin: 5px 0;"><strong>Phone:</strong> +254 701 195 460</p>
                <p style="color: #666; margin: 5px 0;"><strong>Location:</strong> Nakuru, Kenya</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">
                  Thank you for choosing Damon Music Academy for your ${quoteData.service_category} needs!
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
              <p>This quote is valid for 30 days from the date of issue.</p>
              <p>&copy; 2024 Damon Music Academy. All rights reserved.</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `quote-${quoteData.service_category}-${Date.now()}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ]
      }
    });

    if (error) {
      console.error('Error sending quote email:', error);
      return false;
    }

    console.log('Quote email with PDF attachment sent successfully');
    return true;
  } catch (error) {
    console.error('Error in sendQuoteEmail:', error);
    return false;
  }
};

/**
 * Send an invoice email (with PDF attachment) to a student.
 * @param invoice - The invoice object (should include amount_due, period, etc.)
 * @param student - The student object (should include email, name, etc.)
 * @param options - { subject?: string, body?: string, isReminder?: boolean }
 * @returns boolean (success)
 */
export const sendInvoiceEmail = async (
  invoice: any,
  student: any,
  options: { subject?: string; body?: string; isReminder?: boolean; isFirstInvoice?: boolean; isUpdated?: boolean } = {}
): Promise<boolean> => {
  try {
    if (!invoice || !student || !student.email) {
      console.error('❌ Missing required fields for invoice email', { invoice, student });
      return false;
    }
    
    // Build invoiceMeta for PDF generation
    const invoiceMeta = {
      invoiceNumber: options.isFirstInvoice ? 'first' : invoice.id || '',
      periodStart: invoice.period_start || '',
      periodEnd: invoice.period_end || '',
      dueDate: invoice.due_date || '',
      paymentStatus: invoice.status ? invoice.status.toUpperCase() : 'PENDING',
      studentId: student.id || '',
      registrationId: student.registration_id || '',
      sessionsPerWeek: invoice.sessions_per_week || undefined,
      notes: invoice.notes || '',
    };
    
    // Use the invoice details from the invoice object if available, otherwise create a basic structure
    const invoiceDetails = invoice.lessons_summary || {
      lineItems: [
        {
          description: `Music Lessons - ${invoice.period_start ? `${new Date(invoice.period_start).toLocaleDateString()} to ${new Date(invoice.period_end).toLocaleDateString()}` : 'Current Period'}`,
          quantity: 1,
          unitPrice: invoice.amount_due,
          amount: invoice.amount_due
        }
      ],
      subtotal: invoice.amount_due,
      tax: 0,
      total: invoice.amount_due,
      paymentTerms: 'Payment due within 7 days of invoice date',
      validUntil: '30 days from invoice date',
      serviceBreakdown: 'Music lessons as scheduled',
      equipmentBreakdown: 'All necessary equipment and materials provided',
      additionalInfo: invoice.notes || 'Please contact us if you have any questions about this invoice.'
    };
    
    // Generate PDF with proper invoice details structure
    const pdfBlob = await generateQuotePDF(
      {
        name: student.student_name,
        email: student.email,
        phone: student.phone || '',
        service_category: 'Music Lessons',
        project_type: '',
        event_date: '',
        location: '',
        budget_range: '',
        timeline: '',
        specific_requirements: '',
        preferred_contact_method: 'email',
        additional_notes: ''
      },
      invoice.amount_due,
      '',
      invoiceDetails,
      invoiceMeta
    );
    // Convert blob to base64 for email attachment
    const reader = new FileReader();
    const pdfBase64 = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });
    // Email content with proper due date messaging
    const dueDate = new Date(invoice.due_date);
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const subject = options.subject || (options.isReminder
      ? `Payment Reminder: Invoice for ${student.student_name} - Damon Music Academy`
      : options.isUpdated 
        ? `Updated Invoice - ${student.student_name} - Damon Music Academy`
        : `Your Invoice for ${student.student_name} - Damon Music Academy`);
      
    // Build email body with appropriate messages
    let body = options.body;
    if (!body) {
      // Check if invoice has been paid (for credentials message logic)
      const invoicePaid = invoice.payment_status === 'paid' || invoice.status === 'paid' || 
                          (invoice.amount_paid && invoice.amount_paid >= invoice.amount_due);
      
      if (options.isReminder) {
        body = `<p>Dear ${student.student_name},</p>
         <p>This is a friendly reminder that your invoice for the current period is due on <strong>${dueDateStr}</strong>.</p>
         <p><strong>Important:</strong> Payment must be completed by midnight GMT+3 on ${dueDateStr}. After this date, the invoice will be marked as overdue.</p>
         <p>Please find the attached invoice PDF for payment details.</p>
         <p>If you have already paid, please disregard this message.</p>`;
      } else if (options.isUpdated && options.isFirstInvoice && !invoicePaid) {
        // Updated first invoice that hasn't been paid yet - show credentials message
        body = `<p>Dear ${student.student_name},</p>
         <p>Your first invoice has been updated. Please find the <strong>revised invoice</strong> attached.</p>
         <p><strong>⚠️ IMPORTANT:</strong> Please disregard any previous invoice you may have received. This is the correct and current invoice.</p>
         <p><strong>Due Date:</strong> ${dueDateStr} (midnight GMT+3)</p>
         <p><strong>Updated Amount:</strong> KES ${invoice.amount_due.toLocaleString()}</p>
         <p><strong>📧 Student Portal Access:</strong> You will receive your student portal login credentials <strong>only after your first invoice payment has been received and confirmed</strong>. Please ensure timely payment to gain access to your portal where you can book classes, view your schedule, track your progress, and access learning materials.</p>
         <p>Please use this updated invoice for payment. If you have already paid using the previous invoice, please contact us immediately.</p>
         <p>If you have any questions about this update, please contact us.</p>`;
      } else if (options.isUpdated) {
        // Updated invoice (not first invoice, or first invoice already paid)
        body = `<p>Dear ${student.student_name},</p>
         <p>Your invoice has been updated. Please find the <strong>revised invoice</strong> attached.</p>
         <p><strong>⚠️ IMPORTANT:</strong> Please disregard any previous invoice you may have received. This is the correct and current invoice.</p>
         <p><strong>Due Date:</strong> ${dueDateStr} (midnight GMT+3)</p>
         <p><strong>Updated Amount:</strong> KES ${invoice.amount_due.toLocaleString()}</p>
         <p>Please use this updated invoice for payment. If you have already paid using the previous invoice, please contact us immediately.</p>
         <p>If you have any questions about this update, please contact us.</p>`;
      } else if (options.isFirstInvoice && !invoicePaid) {
        // First invoice that hasn't been paid yet - show credentials message
        body = `<p>Dear ${student.student_name},</p>
         <p>Welcome to Damon Music Academy! Please find attached your first invoice.</p>
         <p><strong>Due Date:</strong> ${dueDateStr} (midnight GMT+3)</p>
         <p><strong>Important:</strong> Payment must be completed by midnight GMT+3 on ${dueDateStr}. After this date, the invoice will be marked as overdue.</p>
         <p><strong>📧 Student Portal Access:</strong> You will receive your student portal login credentials <strong>only after your first invoice payment has been received and confirmed</strong>. Please ensure timely payment to gain access to your portal where you can book classes, view your schedule, track your progress, and access learning materials.</p>
         <p>If you have any questions, please contact us.</p>`;
      } else {
        // Regular invoice or first invoice already paid - no credentials message
        body = `<p>Dear ${student.student_name},</p>
         <p>Please find attached your invoice for the current period.</p>
         <p><strong>Due Date:</strong> ${dueDateStr} (midnight GMT+3)</p>
         <p><strong>Important:</strong> Payment must be completed by midnight GMT+3 on ${dueDateStr}. After this date, the invoice will be marked as overdue.</p>
         <p>If you have any questions, please contact us.</p>`;
      }
    }
    // Send email using the same pattern as working emails
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: student.email,
        subject,
        html: `<!DOCTYPE html><html><body>${body}<br/><br/><p>Thank you for being part of Damon Music Academy!</p></body></html>`,
        attachments: [
          {
            filename: `invoice-${student.student_name.replace(/\s+/g, '_')}-${Date.now()}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ]
      }
    });
    if (error) {
      console.error('❌ Invoice email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Invoice email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send invoice email:', data?.message);
      return false;
    }
    console.log('✅ Invoice email sent successfully', { invoice, student, options });
    return true;
  } catch (error) {
    console.error('❌ Error in sendInvoiceEmail:', error);
    return false;
  }
};

export const sendApplicationConfirmationEmail = async (registration: RegistrationData): Promise<boolean> => {
  try {
    console.log('📧 Sending application confirmation email to:', registration.email);

    // Validate required fields
    if (!registration.id || !registration.receipt_number || !registration.student_name || !registration.email || !registration.created_at) {
      console.error('❌ Missing required fields for application confirmation email');
      return false;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const siteUrl = 'https://damonmusicacademy.co.ke';
    const logoUrl = `${siteUrl}/damon-logo.png`;

    // Create HTML email content for application confirmation
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Received - Damon Music Academy</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .receipt-header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #667eea;
          }
          .receipt-number {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
          }
          .section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #495057;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f3f4;
          }
          .info-label {
            font-weight: 600;
            color: #6c757d;
          }
          .info-value {
            color: #495057;
          }
          .status-badge {
            background: #ffc107;
            color: #212529;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .next-steps {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #ffc107;
          }
          .application-fee {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2196f3;
          }
          .contact-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            border-left: 4px solid #2196f3;
          }
          .contact-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .info-grid, .contact-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="{{LOGO_URL}}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
          <h1>🎵 Damon Music Academy</h1>
          <h2>Application Received</h2>
          <p>Thank you for your interest in joining our creative community!</p>
        </div>
        
        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #: ${registration.receipt_number}</div>
            <div>Application Date: ${formatDate(registration.created_at)}</div>
            <div class="status-badge">UNDER REVIEW</div>
          </div>

          <div class="section">
            <div class="section-title">👤 Student Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${registration.student_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span>
                <span class="info-value">${registration.age} years</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${registration.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${registration.country_code} ${registration.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value">${registration.location}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🎓 Course Details</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Course Category:</span>
                <span class="info-value">${registration.course_category}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Subject/Instrument:</span>
                <span class="info-value">${(() => {
                  if (registration.course_category === 'Music') return registration.instrument;
                  if (registration.course_category === 'Production') return registration.production_type;
                  return 'Art Course';
                })()}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Proficiency Level:</span>
                <span class="info-value">${registration.proficiency_level}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Learning Mode:</span>
                <span class="info-value">${registration.learning_mode}</span>
              </div>
              ${registration.course_category === 'Music' ? `
              <div class="info-item">
                <span class="info-label">Owns Instrument:</span>
                <span class="info-value">${registration.owns_instrument ? 'Yes' : 'No'}</span>
              </div>
              ` : ''}
              ${registration.preferred_schedule ? `
              <div class="info-item">
                <span class="info-label">Preferred Schedule:</span>
                <span class="info-value">${registration.preferred_schedule}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${registration.parent_name ? `
          <div class="section">
            <div class="section-title">👨‍👩‍👧‍👦 Parent/Guardian Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${registration.parent_name}</span>
              </div>
              ${registration.parent_phone ? `
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${registration.parent_phone}</span>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${registration.medical_condition === 'yes' ? `
          <div class="section">
            <div class="section-title">🏥 Medical Information</div>
            <div class="info-item">
              <span class="info-label">Medical Conditions:</span>
              <span class="info-value">Yes</span>
            </div>
            <div class="info-item">
              <span class="info-label">Details:</span>
              <span class="info-value">${registration.medical_details}</span>
            </div>
          </div>
          ` : ''}

          ${registration.goals ? `
          <div class="section">
            <div class="section-title">🎯 Learning Goals</div>
            <p>${registration.goals}</p>
          </div>
          ` : ''}

          <div class="application-fee">
            <h3>💰 Application Fee Information</h3>
            <p><strong>Important:</strong> If your application is accepted, you will receive an invoice that includes:</p>
            <ul>
              <li><strong>One-time enrollment fee:</strong> 800 KSh (non-refundable)</li>
              <li><strong>First month's tuition:</strong> Based on your selected course and sessions</li>
              <li><strong>Total due:</strong> Enrollment fee + Tuition</li>
            </ul>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>Note:</strong> Payment of this invoice will finalize your enrollment and secure your spot in our program.
            </p>
          </div>

          <div class="next-steps">
            <h3>📋 What's Next?</h3>
            <ul>
              <li>We'll review your application and contact you within <strong>2 business days</strong> with an update.</li>
              <li>Please keep this receipt number (<strong>${registration.receipt_number}</strong>) for your records.</li>
              <li>You can track your application status using your email address.</li>
              <li>If you have any questions, feel free to contact us using the information below.</li>
              <li>In the meantime, explore more about our diverse offerings on our website, or check our <a href="${siteUrl}/faq" style="color: #2196f3;">FAQs</a>.</li>
            </ul>
          </div>

          <div class="contact-info">
            <h3>📞 Need Help? Contact Us</h3>
            <div class="contact-grid">
              <div class="info-item">
                <span class="info-label">📱 Phone:</span>
                <span class="info-value">+254 701 195 460 / +254 713 490 535</span>
              </div>
              <div class="info-item">
                <span class="info-label">📧 Email:</span>
                <span class="info-value">info@damonmusicacademy.com</span>
              </div>
              <div class="info-item">
                <span class="info-label">📍 Address:</span>
                <span class="info-value">Nakuru, Kenya</span>
              </div>
              <div class="info-item">
                <span class="info-label">🕒 Hours:</span>
                <span class="info-value">Sun: 8am-6pm, Mon-Fri: 7am-6pm (Academy)</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Damon Music Academy!</p>
            <p>We look forward to connecting with you soon!</p>
            <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Call the Supabase Edge Function to send the email
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: registration.email,
        subject: `Application Received - ${registration.receipt_number} | Damon Music Academy`,
        html: emailHTML,
        registration: registration
      }
    });

    if (error) {
      console.error('❌ Application confirmation email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Application confirmation email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send application confirmation email:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Application confirmation email error:', error);
    return false;
  }
};

export const sendPaymentConfirmationEmail = async (registration: RegistrationData, tempPassword?: string | null): Promise<boolean> => {
  try {
    console.log('📧 Sending payment confirmation email to:', registration.email);

    if (!registration.id || !registration.receipt_number || !registration.student_name || !registration.email || !registration.created_at) {
      console.error('❌ Missing required fields for payment confirmation email');
      return false;
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const siteUrl = 'https://damonmusicacademy.co.ke';
    const logoUrl = `${siteUrl}/damon-logo.png`;

    // Create HTML email content for payment confirmation
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received - Enrollment Confirmed | Damon Music Academy</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
          .header { background: linear-gradient(135deg, #28a745 0%, #00c6ff 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .receipt-header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745; }
          .receipt-number { font-size: 18px; font-weight: bold; color: #28a745; }
          .section { margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .section-title { font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f3f4; }
          .info-label { font-weight: 600; color: #6c757d; }
          .info-value { color: #495057; }
          .status-badge { background: #28a745; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .next-steps { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745; }
          .login-credentials { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3; }
          .payment-confirmed { background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #17a2b8; }
          .contact-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #2196f3; }
          .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
          @media (max-width: 600px) { .info-grid, .contact-grid { grid-template-columns: 1fr; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="{{LOGO_URL}}" alt="Damon Music Academy Logo" style="height: 70px; margin-bottom: 20px;">
          <h1>🎉 Payment Received!</h1>
          <h2>You're Officially Enrolled at Damon Music Academy</h2>
          <p>Welcome to the Damon Music Academy family! Your payment has been confirmed and your enrollment is now complete.</p>
        </div>
        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #: ${registration.receipt_number}</div>
            <div>Enrollment Date: ${formatDate(registration.created_at)}</div>
            <div class="status-badge">ENROLLED</div>
          </div>
          <div class="section">
            <div class="section-title">👤 Student Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Full Name:</span><span class="info-value">${registration.student_name}</span></div>
              <div class="info-item"><span class="info-label">Age:</span><span class="info-value">${registration.age} years</span></div>
              <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${registration.email}</span></div>
              <div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${registration.country_code} ${registration.phone}</span></div>
              <div class="info-item"><span class="info-label">Location:</span><span class="info-value">${registration.location}</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">🎓 Course Details</div>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Course Category:</span><span class="info-value">${registration.course_category}</span></div>
              <div class="info-item"><span class="info-label">Subject/Instrument:</span><span class="info-value">${(() => {
                if (registration.course_category === 'Music') return registration.instrument;
                if (registration.course_category === 'Production') return registration.production_type;
                return 'Art Course';
              })()}</span></div>
              <div class="info-item"><span class="info-label">Proficiency Level:</span><span class="info-value">${registration.proficiency_level}</span></div>
              <div class="info-item"><span class="info-label">Learning Mode:</span><span class="info-value">${registration.learning_mode}</span></div>
              ${registration.course_category === 'Music' ? `<div class="info-item"><span class="info-label">Owns Instrument:</span><span class="info-value">${registration.owns_instrument ? 'Yes' : 'No'}</span></div>` : ''}
              ${registration.preferred_schedule ? `<div class="info-item"><span class="info-label">Preferred Schedule:</span><span class="info-value">${registration.preferred_schedule}</span></div>` : ''}
            </div>
          </div>
          ${registration.parent_name ? `<div class="section"><div class="section-title">👨‍👩‍👧‍👦 Parent/Guardian Information</div><div class="info-grid"><div class="info-item"><span class="info-label">Name:</span><span class="info-value">${registration.parent_name}</span></div>${registration.parent_phone ? `<div class="info-item"><span class="info-label">Phone:</span><span class="info-value">${registration.parent_phone}</span></div>` : ''}</div></div>` : ''}
          ${registration.medical_condition === 'yes' ? `<div class="section"><div class="section-title">🏥 Medical Information</div><div class="info-item"><span class="info-label">Medical Conditions:</span><span class="info-value">Yes</span></div><div class="info-item"><span class="info-label">Details:</span><span class="info-value">${registration.medical_details}</span></div></div>` : ''}
          
          <div class="payment-confirmed">
            <h3>✅ Payment Confirmed</h3>
            <p><strong>Great news!</strong> Your payment has been successfully processed and your enrollment is now complete.</p>
            <ul>
              <li><strong>Enrollment fee:</strong> ✅ Paid</li>
              <li><strong>First month's tuition:</strong> ✅ Paid</li>
              <li><strong>Status:</strong> ✅ Officially Enrolled</li>
            </ul>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>What's next:</strong> We will contact you within 24-48 hours with your personalized class schedule and further instructions.
            </p>
          </div>
          
          ${tempPassword ? `
          <div class="login-credentials">
            <h3>🔐 Your Student Portal Login Credentials</h3>
            <p><strong>Important:</strong> You can now access your personalized student portal with the following credentials:</p>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">Login URL:</span><span class="info-value"><a href="${siteUrl}/auth" style="color: #2196f3; text-decoration: none;">${siteUrl}/auth</a></span></div>
              <div class="info-item"><span class="info-label">Email:</span><span class="info-value">${registration.email}</span></div>
              <div class="info-item"><span class="info-label">Temporary Password:</span><span class="info-value"><strong>${tempPassword}</strong></span></div>
            </div>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              <strong>Security Note:</strong> Please change your password on your first login for security purposes.
            </p>
          </div>
          ` : ''}
          
          <div class="next-steps">
            <h3>🎯 What's Next?</h3>
            <ul>
              <li><strong>Class Schedule:</strong> We will contact you within 24-48 hours with your personalized class schedule.</li>
              <li><strong>First Lesson:</strong> Your first lesson will be scheduled based on your preferred schedule and instructor availability.</li>
              <li><strong>Welcome Kit:</strong> You will receive information about any required materials or equipment for your course.</li>
              ${tempPassword ? '<li><strong>Student Portal:</strong> Access your student portal using the credentials provided above to view your lessons, materials, and progress.</li>' : ''}
              <li><strong>Questions:</strong> If you have any questions, feel free to contact us using the information below.</li>
            </ul>
          </div>
          <div class="contact-info">
            <h3>📞 Need Help? Contact Us</h3>
            <div class="contact-grid">
              <div class="info-item"><span class="info-label">📱 Phone:</span><span class="info-value">+254 701 195 460 / +254 713 490 535</span></div>
              <div class="info-item"><span class="info-label">📧 Email:</span><span class="info-value">info@damonmusicacademy.com</span></div>
              <div class="info-item"><span class="info-label">📍 Address:</span><span class="info-value">Nakuru, Kenya</span></div>
              <div class="info-item"><span class="info-label">🕒 Hours:</span><span class="info-value">Sun: 8am-6pm, Mon-Fri: 7am-6pm (Academy)</span></div>
            </div>
          </div>
          <div class="footer">
            <p>Welcome to the Damon Music Academy family!</p>
            <p>We are excited to help you achieve your creative dreams.</p>
            <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
      body: {
        to: registration.email,
        subject: `Payment Received - Enrollment Confirmed | Damon Music Academy`,
        html: emailHTML,
        registration: registration
      }
    });

    if (error) {
      console.error('❌ Payment confirmation email sending error:', error);
      return false;
    }

    if (data && data.success) {
      console.log('✅ Payment confirmation email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send payment confirmation email:', data?.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Payment confirmation email error:', error);
    return false;
  }
};
