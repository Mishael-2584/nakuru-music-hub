import { supabase } from '../integrations/supabase/client';
import { generateQuotePDF } from './pdfGenerator';
import { Invoice } from '../integrations/supabase/types';

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
export async function generateInvoiceForRegistration(registrationId: string): Promise<Invoice | null> {
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
    // Start: 1st of next month, End: last day of next month
    periodStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  } else if (fee.payment_type === 'term') {
    // Start: enrollment date, End: +3 months
    periodStart = new Date(registration.created_at);
    periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 3);
    periodEnd.setDate(periodEnd.getDate() - 1);
  } else {
    throw new Error('Unsupported payment type');
  }

  // Prepare invoice data
  const invoiceData = {
    student_id: student.id,
    registration_id: registration.id,
    fee_id: fee.id,
    amount: fee.price,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    due_date: fee.payment_type === 'monthly'
      ? new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString().slice(0, 10)
      : periodEnd.toISOString().slice(0, 10),
    status: 'pending',
    is_auto_generated: true,
    admin_override: false,
    notes: null,
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

  for (const reg of registrations) {
    try {
      await generateInvoiceForRegistration(reg.id);
    } catch (err) {
      // Log or handle error for this registration
      console.error(`Failed to generate invoice for registration ${reg.id}:`, err);
    }
  }
} 