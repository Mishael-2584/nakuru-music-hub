// Supabase Edge Function: generate-recurring-invoices
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Use environment variables for keys
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendInvoiceEmail(invoice, student, isReminder = false) {
  const subject = isReminder
    ? `Payment Reminder: Invoice for ${student.student_name} - Damon Music Academy`
    : `Your Invoice for ${student.student_name} - Damon Music Academy`;
  const body = isReminder
    ? `Dear ${student.student_name},\n\nThis is a friendly reminder that your invoice for the current period is due.\n\nInvoice Amount: KES ${invoice.amount}\nPeriod: ${invoice.period_start} to ${invoice.period_end}\nDue Date: ${invoice.due_date}\n\nIf you have already paid, please disregard this message.\n\nThank you!\nDamon Music Academy`
    : `Dear ${student.student_name},\n\nPlease find your invoice for the current period below.\n\nInvoice Amount: KES ${invoice.amount}\nPeriod: ${invoice.period_start} to ${invoice.period_end}\nDue Date: ${invoice.due_date}\n\nIf you have any questions, let us know.\n\nThank you!\nDamon Music Academy`;
  const { error } = await supabase.functions.invoke('send-confirmation-email', {
    body: {
      to: student.email,
      subject,
      text: body,
      invoice,
      student
    }
  });
  if (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
  return true;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function generateInvoicesForRegistration(registration, fee, student, summary) {
  // Find the latest invoice for this registration
  const { data: latestInvoice, error: latestError } = await supabase
    .from('invoices')
    .select('*')
    .eq('registration_id', registration.id)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;

  let startDate;
  if (latestInvoice) {
    // Start from the day after the last invoice's period_end
    startDate = new Date(latestInvoice.period_end);
    startDate.setDate(startDate.getDate() + 1);
  } else {
    // Start from enrollment/registration date
    startDate = new Date(registration.created_at);
  }

  const now = new Date();
  let periods = [];

  if (fee.payment_type === 'monthly') {
    // Generate for each unbilled month up to the current/next month
    let periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    while (periodStart <= now) {
      periods.push({
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(periodStart.getFullYear(), periodStart.getMonth(), 5)
      });
      // Next month
      periodStart = addMonths(periodStart, 1);
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    }
  } else if (fee.payment_type === 'term') {
    // Generate for each unbilled term (3 months) up to now
    let periodStart = new Date(startDate);
    let periodEnd = addMonths(periodStart, 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
    while (periodStart <= now) {
      periods.push({
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(periodEnd) // due at end of term
      });
      // Next term
      periodStart = addMonths(periodStart, 3);
      periodEnd = addMonths(periodStart, 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }
  } else {
    throw new Error('Unsupported payment type');
  }

  for (const period of periods) {
    const periodStartStr = formatDate(period.periodStart);
    const periodEndStr = formatDate(period.periodEnd);
    // Check if invoice exists for this period
    const { data: existingInvoice, error: existingError } = await supabase
      .from('invoices')
      .select('*')
      .eq('student_id', student.id)
      .eq('registration_id', registration.id)
      .eq('period_start', periodStartStr)
      .eq('period_end', periodEndStr)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingInvoice) {
      if (existingInvoice.status !== 'paid') {
        await sendInvoiceEmail(existingInvoice, student, true);
        summary.reminders++;
      } else {
        summary.skipped++;
      }
      continue;
    }
    // Create invoice
    const invoiceData = {
      student_id: student.id,
      registration_id: registration.id,
      fee_id: fee.id,
      amount: fee.price,
      period_start: periodStartStr,
      period_end: periodEndStr,
      due_date: formatDate(period.dueDate),
      status: 'pending',
      is_auto_generated: true,
      admin_override: false,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select('*')
      .single();
    if (invError) {
      summary.errors++;
      console.error('Failed to create invoice:', invError);
      continue;
    }
    await sendInvoiceEmail(invoice, student, false);
    summary.created++;
  }
}

serve(async (req) => {
  try {
    // Fetch all active registrations
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('status', 'approved');
    if (error) throw error;
    if (!registrations) return new Response('No registrations found', { status: 200 });

    const summary = { created: 0, skipped: 0, reminders: 0, errors: 0 };

    for (const reg of registrations) {
      try {
        // Fetch student and fee
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (studentError || !student) throw studentError || new Error('Student not found');
        const { data: fee, error: feeError } = await supabase
          .from('fees')
          .select('*')
          .eq('course_type', reg.course_category)
          .eq('course_name', reg.instrument)
          .eq('is_active', true)
          .single();
        if (feeError || !fee) throw feeError || new Error('Fee not found for registration');
        await generateInvoicesForRegistration(reg, fee, student, summary);
      } catch (err) {
        console.error(`Failed to process registration ${reg.id}:`, err);
        summary.errors++;
      }
    }
    console.log('Recurring invoice generation summary:', summary);
    return new Response('Recurring invoices processed. Summary: ' + JSON.stringify(summary), { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}); 