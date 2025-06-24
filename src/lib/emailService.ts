import { supabase } from '@/integrations/supabase/client';

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
          <p>Thank you for choosing us for your musical journey!</p>
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
            <p>We look forward to helping you achieve your musical dreams.</p>
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
