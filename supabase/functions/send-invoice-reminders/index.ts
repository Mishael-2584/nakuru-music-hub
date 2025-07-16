// Supabase Edge Function: send-invoice-reminders
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendReminderEmail(invoice: any, student: any) {
  // Compose a simple reminder email (customize as needed)
  const subject = `Payment Reminder: Invoice Due for Damon Music Academy`;
  const body = `<p>Dear ${student.student_name},</p><p>This is a friendly reminder that your invoice for the period ${invoice.period_start} to ${invoice.period_end} is due. Please make payment as soon as possible. If you have already paid, please disregard this message.</p>`;
  const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: student.email,
      subject,
      html: `<!DOCTYPE html><html><body>${body}<br/><br/><p>Thank you for being part of Damon Music Academy!</p></body></html>`,
      invoice,
      student,
      attachments: []
    }
  });
  if (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
  return data && data.success;
}

serve(async (req) => {
  const today = new Date().toISOString().slice(0, 10);
  // Find all invoices that are pending or overdue and due_date < today
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .in('status', ['pending', 'overdue'])
    .lt('due_date', today);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  let remindersSent = 0;
  for (const invoice of invoices || []) {
    // Fetch student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', invoice.student_id)
      .single();
    if (student && !studentError) {
      const sent = await sendReminderEmail(invoice, student);
      if (sent) remindersSent++;
    }
    // Optionally, mark as overdue if past due date
    if (invoice.status === 'pending' && invoice.due_date < today) {
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id);
    }
  }
  return new Response(JSON.stringify({ remindersSent }), { status: 200 });
}); 