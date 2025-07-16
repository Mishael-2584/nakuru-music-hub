import { supabase } from '../integrations/supabase/client';
import { generateQuotePDF } from './pdfGenerator';
import { Invoice } from '../integrations/supabase/types';
import { sendInvoiceEmail } from './emailService';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  lessonIds: string[];
}

export interface InvoiceCalculationResult {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
}

/**
 * Calculate invoice line items and totals for a student for a given period.
 * @param studentId - The student's UUID
 * @param periodStart - Start date (YYYY-MM-DD)
 * @param periodEnd - End date (YYYY-MM-DD)
 * @returns InvoiceCalculationResult
 */
export async function calculateStudentInvoice(studentId: string, periodStart: string, periodEnd: string): Promise<InvoiceCalculationResult> {
  // Fetch all completed/confirmed lessons for the student in the period
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('student_id', studentId)
    .gte('lesson_date', periodStart)
    .lte('lesson_date', periodEnd)
    .in('status', ['completed', 'confirmed']);

  if (lessonsError) throw lessonsError;
  if (!lessons || lessons.length === 0) {
    return { lineItems: [], subtotal: 0, total: 0 };
  }

  // Fetch all active fees
  const { data: fees, error: feesError } = await supabase
    .from('fees')
    .select('*')
    .eq('is_active', true);
  if (feesError) throw feesError;

  // Group lessons by type/mode/level for pricing
  const lineItems: InvoiceLineItem[] = [];
  for (const fee of fees) {
    // Find lessons matching this fee (by course_type, course_name, mode, etc.)
    const matchingLessons = lessons.filter(lesson => {
      // Match by course_type, mode, lesson_type, etc. (customize as needed)
      return (
        lesson.lesson_type === (fee.course_type || 'regular') &&
        (!fee.mode || lesson.mode === fee.mode) &&
        (!fee.level || lesson.level === fee.level)
      );
    });
    if (matchingLessons.length > 0) {
      lineItems.push({
        description: `${fee.course_name}${fee.mode ? ' - ' + fee.mode : ''}`,
        quantity: matchingLessons.length,
        unitPrice: fee.price,
        amount: fee.price * matchingLessons.length,
        lessonIds: matchingLessons.map(l => l.id),
      });
    }
  }

  // Add any lessons that didn't match a fee as a fallback
  const matchedLessonIds = lineItems.flatMap(item => item.lessonIds);
  const unmatchedLessons = lessons.filter(l => !matchedLessonIds.includes(l.id));
  for (const lesson of unmatchedLessons) {
    lineItems.push({
      description: lesson.title || 'Lesson',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      lessonIds: [lesson.id],
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal; // Add tax/discount logic if needed

  return { lineItems, subtotal, total };
}

/**
 * Generate a PDF for an invoice and upload to Supabase Storage. Returns the public URL.
 * @param invoice - The invoice object (with lessons_summary, student info, etc.)
 * @param student - The student object (for name/email)
 * @returns The public URL of the uploaded PDF
 */
export async function generateAndUploadInvoicePDF(invoice: any, student: any): Promise<string> {
  // Prepare invoice details for PDF
  const invoiceDetails = invoice.lessons_summary;
  const quoteData = {
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
    reference_materials_url: '',
    status: '',
    admin_notes: '',
    quote_amount: invoice.amount_due,
    quote_sent_at: '',
    preferred_contact_method: 'email',
    additional_notes: ''
  };
  // Generate PDF blob
  const pdfBlob = await generateQuotePDF(quoteData, invoice.amount_due, '', invoiceDetails);
  // Upload to Supabase Storage
  const fileName = `invoices/${student.id}_${invoice.period_start}_${invoice.period_end}.pdf`;
  const { data, error } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, { upsert: true, contentType: 'application/pdf' });
  if (error) throw error;
  // Get public URL
  const { publicUrl } = supabase.storage.from('invoices').getPublicUrl(fileName).data;
  return publicUrl;
}

/**
 * Generate an invoice for a given registration.
 * @param registrationId - The registration UUID
 * @returns The created Invoice object
 */
export async function generateInvoiceForRegistration(registrationId: string): Promise<Invoice | null | { existing: Invoice }> {
  // Fetch registration, student, and fee info
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single();
  if (regError || !registration) throw regError || new Error('Registration not found');

  // Find the student for this registration
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', registration.student_id)
    .single();
  if (studentError || !student) throw studentError || new Error('Student not found');

  // Find the matching fee
  const { data: fee, error: feeError } = await supabase
    .from('fees')
    .select('*')
    .eq('course_type', registration.course_category)
    .eq('course_name', registration.instrument)
    .eq('is_active', true)
    .single();
  if (feeError || !fee) throw feeError || new Error('Fee not found for registration');

  // Determine billing period
  const now = new Date();
  let periodStart: Date, periodEnd: Date;
  if (fee.payment_type === 'monthly') {
    periodStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  } else if (fee.payment_type === 'term') {
    periodStart = new Date(registration.created_at);
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    throw new Error('Unsupported payment type');
  }
  const periodStartStr = periodStart.toISOString().slice(0, 10);
  const periodEndStr = periodEnd.toISOString().slice(0, 10);

  // Check for existing invoice for this student/registration/period
  const { data: existingInvoice, error: existingError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .eq('registration_id', registration.id)
    .eq('period_start', periodStartStr)
    .eq('period_end', periodEndStr)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingInvoice) return { existing: existingInvoice }; // Already exists, return existing

  // --- Makeup Credits Enforcement Logic ---
  // 1. Find the previous invoice for this registration (by period_end < current period_start)
  const { data: prevInvoice, error: prevInvError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .eq('registration_id', registration.id)
    .lt('period_end', periodStartStr)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prevInvError) throw prevInvError;

  let creditsApplied = 0;
  let creditsValue = 0;
  let makeupCreditIds: string[] = [];
  let notes = null;
  let invoiceAmount = fee.price;

  // Only apply credits if previous invoice is paid (or if this is the first invoice)
  let canApplyCredits = false;
  if (!prevInvoice) {
    canApplyCredits = true; // First invoice, allow credits (if you want to, or set to false to never apply on first)
  } else if (prevInvoice.status === 'paid') {
    canApplyCredits = true;
  }

  if (canApplyCredits) {
    // Fetch unused, unexpired makeup credits for this student
    const { data: credits, error: creditsError } = await supabase
      .from('makeup_credits')
      .select('*')
      .eq('student_id', student.id)
      .eq('is_used', false)
      .gte('expires_at', periodStartStr);
    if (creditsError) throw creditsError;
    if (credits && credits.length > 0) {
      // Each credit = 1 session, value = session price (fee.price / expected sessions per month/term)
      const sessionsPerMonth = fee.sessions_per_week ? fee.sessions_per_week * 4 : 4; // fallback to 4
      const sessionValue = Math.round((fee.price / sessionsPerMonth) * 100) / 100;
      creditsApplied = credits.length;
      creditsValue = Math.min(creditsApplied * sessionValue, invoiceAmount);
      invoiceAmount = Math.max(0, invoiceAmount - creditsValue);
      makeupCreditIds = credits.slice(0, Math.floor(creditsValue / sessionValue)).map(c => c.id);
      notes = `Applied ${makeupCreditIds.length} makeup credit(s) worth KES ${creditsValue.toLocaleString()} to this invoice.`;
    }
  }

  // Prepare invoice data
  const invoiceData = {
    student_id: student.id,
    registration_id: registration.id,
    fee_id: fee.id,
    amount: invoiceAmount,
    period_start: periodStartStr,
    period_end: periodEndStr,
    due_date: fee.payment_type === 'monthly'
      ? new Date(periodStart.getFullYear(), periodStart.getMonth(), 10).toISOString().slice(0, 10)
      : periodEndStr,
    status: 'pending',
    is_auto_generated: true,
    admin_override: false,
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Insert invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select('*')
    .single();
  if (invError) throw invError;

  // Mark applied credits as used and associate with this invoice
  if (makeupCreditIds.length > 0 && invoice) {
    await supabase
      .from('makeup_credits')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .in('id', makeupCreditIds);
  }

  return invoice as Invoice;
}

/**
 * Generate recurring invoices for all active registrations.
 * Should be run as a scheduled job (e.g., monthly/termly).
 */
export async function generateRecurringInvoices(): Promise<void> {
  // Fetch all active registrations
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('status', 'approved');
  if (error) throw error;
  if (!registrations) return;

  const summary = { created: 0, skipped: 0, reminders: 0, errors: 0 };

  for (const reg of registrations) {
    try {
      const result = await generateInvoiceForRegistration(reg.id);
      if (result && 'existing' in result) {
        const invoice = result.existing;
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError && invoice.status !== 'paid') {
          await sendInvoiceEmail(invoice, student, { isReminder: true });
          summary.reminders++;
        } else {
          summary.skipped++;
        }
      } else if (result) {
        const invoice = result as Invoice;
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError) {
          await sendInvoiceEmail(invoice, student);
        }
        summary.created++;
      } else {
        summary.skipped++;
      }
    } catch (err) {
      console.error(`Failed to generate/send invoice for registration ${reg.id}:`, err);
      summary.errors++;
    }
  }
  console.log('Recurring invoice generation summary:', summary);
} 