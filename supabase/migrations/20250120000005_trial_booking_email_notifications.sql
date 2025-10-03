-- Migration: Add email notification function for trial booking assignments
-- This creates a function to send email notifications to teachers when assigned trial classes

-- Create function to send trial booking email notification to teacher
CREATE OR REPLACE FUNCTION send_trial_booking_teacher_email(
  p_trial_booking_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  booking_record RECORD;
  teacher_record RECORD;
  email_html TEXT;
  scheduled_date_text TEXT;
  scheduled_time_text TEXT;
BEGIN
  -- Get trial booking details with teacher information
  SELECT 
    tb.*,
    t.name as teacher_name,
    t.email as teacher_email,
    t.phone as teacher_phone
  INTO booking_record
  FROM public.trial_bookings tb
  JOIN public.teachers t ON tb.assigned_teacher_id = t.id
  WHERE tb.id = p_trial_booking_id
    AND tb.assigned_teacher_id IS NOT NULL
    AND tb.status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trial booking not found or not properly assigned to teacher';
  END IF;

  -- Format scheduled date and time
  IF booking_record.scheduled_datetime IS NOT NULL THEN
    scheduled_date_text := TO_CHAR(booking_record.scheduled_datetime, 'Day, Month DD, YYYY');
    scheduled_time_text := TO_CHAR(booking_record.scheduled_datetime, 'HH12:MI AM');
  ELSE
    scheduled_date_text := 'To be confirmed';
    scheduled_time_text := 'To be confirmed';
  END IF;

  -- Create email HTML content
  email_html := '
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Trial Class Assignment - Damon Music Academy</title>
      <style>
        body {
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: white;
          padding: 30px;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .student-info {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #2196f3;
        }
        .schedule-info {
          background: #f3e5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #9c27b0;
        }
        .contact-info {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #4caf50;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #ffc107;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎵 New Trial Class Assignment</h1>
        <p>Damon Music Academy</p>
      </div>
      <div class="content">
        <p>Dear ' || booking_record.teacher_name || ',</p>
        
        <p>You have been assigned a new trial class! Here are the details:</p>
        
        <div class="schedule-info">
          <h3>📅 Class Schedule</h3>
          <p><strong>Date:</strong> ' || scheduled_date_text || '</p>
          <p><strong>Time:</strong> ' || scheduled_time_text || '</p>
          <p><strong>Instrument:</strong> ' || booking_record.instrument || '</p>
          <p><strong>Location:</strong> ' || booking_record.preferred_location || '</p>
        </div>
        
        <div class="student-info">
          <h3>👨‍🎓 Student Information</h3>
          <p><strong>Student Name:</strong> ' || booking_record.student_name || '</p>
          <p><strong>Age:</strong> ' || booking_record.student_age || ' years old</p>
          <p><strong>Skill Level:</strong> ' || booking_record.skill_level || '</p>
          <p><strong>Parent/Guardian:</strong> ' || booking_record.parent_name || '</p>
        </div>
        
        <div class="contact-info">
          <h3>📞 Contact Information</h3>
          <p><strong>Email:</strong> ' || booking_record.email || '</p>
          <p><strong>Phone:</strong> ' || booking_record.phone || '</p>
        </div>';

  -- Add learning goals if provided
  IF booking_record.learning_goals IS NOT NULL AND booking_record.learning_goals != '' THEN
    email_html := email_html || '
        <div class="highlight">
          <h3>🎯 Learning Goals</h3>
          <p>' || booking_record.learning_goals || '</p>
        </div>';
  END IF;

  -- Add previous experience if provided
  IF booking_record.previous_experience IS NOT NULL AND booking_record.previous_experience != '' THEN
    email_html := email_html || '
        <div class="highlight">
          <h3>📚 Previous Experience</h3>
          <p>' || booking_record.previous_experience || '</p>
        </div>';
  END IF;

  -- Add special requirements if provided
  IF booking_record.special_requirements IS NOT NULL AND booking_record.special_requirements != '' THEN
    email_html := email_html || '
        <div class="highlight">
          <h3>⚠️ Special Requirements</h3>
          <p>' || booking_record.special_requirements || '</p>
        </div>';
  END IF;

  email_html := email_html || '
        <div class="highlight">
          <h3>📋 Next Steps</h3>
          <ul>
            <li>Review the student information and prepare for the trial class</li>
            <li>Contact the parent/guardian if you need any additional information</li>
            <li>Log into your teacher dashboard to view full details</li>
            <li>Prepare a brief assessment and learning plan for the student</li>
          </ul>
        </div>
        
        <p>Please log into your teacher dashboard to view the complete trial booking details and manage this assignment.</p>
        
        <div class="footer">
          <p>Thank you for your dedication to our students!</p>
          <p><strong>Damon Music Academy</strong> | Nakuru, Kenya</p>
          <p>Phone: +254 701 195 460 | Email: info@damonmusicacademy.com</p>
        </div>
      </div>
    </body>
    </html>';

  -- Send the email using the existing email service
  PERFORM supabase.functions.invoke('send-confirmation-email', jsonb_build_object(
    'body', jsonb_build_object(
      'to', booking_record.teacher_email,
      'subject', 'New Trial Class Assignment - ' || booking_record.student_name || ' (' || booking_record.instrument || ')',
      'html', email_html
    )
  ));

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send email when trial booking is assigned to teacher
CREATE OR REPLACE FUNCTION trigger_send_trial_booking_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send email if a teacher is assigned and status is 'scheduled'
  IF NEW.assigned_teacher_id IS NOT NULL AND NEW.status = 'scheduled' THEN
    -- Send email notification to teacher
    PERFORM send_trial_booking_teacher_email(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically send email notifications
DROP TRIGGER IF EXISTS trigger_send_trial_booking_email_trigger ON public.trial_bookings;
CREATE TRIGGER trigger_send_trial_booking_email_trigger
  AFTER INSERT OR UPDATE ON public.trial_bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_trial_booking_email();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_trial_booking_teacher_email(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION send_trial_booking_teacher_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_send_trial_booking_email() TO service_role;
GRANT EXECUTE ON FUNCTION trigger_send_trial_booking_email() TO authenticated;

