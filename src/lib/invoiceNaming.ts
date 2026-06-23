type InvoicePeriodFields = {
  period_start?: string | null;
  period_end?: string | null;
};

function parseBillingMonthDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.split('T')[0];
  const [year, month, day] = normalized.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Human billing month for an invoice (the calendar month the period ends in).
 * e.g. 2026-05-31 → 2026-06-30 is shown as "June 2026".
 */
export function formatInvoiceBillingMonth(invoice: InvoicePeriodFields): string {
  const date = parseBillingMonthDate(invoice.period_end) ?? parseBillingMonthDate(invoice.period_start);
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildInvoiceBillingMonthSlug(invoice: InvoicePeriodFields): string {
  const label = formatInvoiceBillingMonth(invoice);
  if (!label) return '';
  return label.replace(/\s+/g, '_');
}

/** Safe segment for file paths (student name, etc.). */
export function sanitizeInvoiceFilePart(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'Student'
  );
}

/** Human-readable invoice reference shown on the PDF (not a UUID). */
export function buildInvoiceDisplayNumber(
  student: { student_name?: string | null },
  invoice: InvoicePeriodFields,
  isFirstInvoice?: boolean
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const prefix = isFirstInvoice ? 'FIRST' : 'INV';
  const billingMonth = buildInvoiceBillingMonthSlug(invoice);
  if (billingMonth) {
    return `${prefix}-${name}-${billingMonth}`;
  }
  return `${prefix}-${name}`;
}

/** Object key inside the `invoices` storage bucket (no bucket name prefix). */
export function buildInvoiceStoragePath(
  student: { student_name?: string | null },
  invoice: InvoicePeriodFields
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const periodSlug = buildInvoiceBillingMonthSlug(invoice) || `undated_${Date.now()}`;
  return `${name}_${periodSlug}.pdf`;
}

/** True when a stored pdf_url points at a missing bucket or legacy double-folder path. */
export function isBrokenInvoicePdfUrl(pdfUrl: string | null | undefined): boolean {
  if (!pdfUrl) return true;
  if (pdfUrl.includes('Bucket not found')) return true;
  // Legacy bug: bucket "invoices" + path "invoices/file.pdf"
  if (/\/invoices\/invoices\//.test(pdfUrl)) return true;
  return false;
}

/** Filename when the user downloads/opens the PDF in the browser. */
export function buildInvoiceDownloadFileName(
  student: { student_name?: string | null },
  invoice: InvoicePeriodFields
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const billingMonth = buildInvoiceBillingMonthSlug(invoice);
  if (billingMonth) {
    return `Invoice_${name}_${billingMonth}.pdf`;
  }
  return `Invoice_${name}.pdf`;
}

/** Human-readable payment receipt reference. */
export function buildPaymentReceiptNumber(
  student: { student_name?: string | null },
  payment: { id: string; paid_date?: string | null }
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const date = (payment.paid_date || '').replace(/-/g, '') || 'nodate';
  const shortId = payment.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `RCP-${name}-${date}-${shortId}`;
}

/** Filename when admin downloads a payment receipt PDF. */
export function buildPaymentReceiptDownloadFileName(
  student: { student_name?: string | null },
  payment: { id: string; paid_date?: string | null }
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const date = payment.paid_date || 'undated';
  return `PaymentReceipt_${name}_${date}.pdf`;
}
