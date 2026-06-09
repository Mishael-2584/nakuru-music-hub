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
  invoice: { period_start?: string | null; period_end?: string | null },
  isFirstInvoice?: boolean
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const start = invoice.period_start || '';
  const end = invoice.period_end || '';
  const prefix = isFirstInvoice ? 'FIRST' : 'INV';
  if (start && end) {
    return `${prefix}-${name}-${start}_to_${end}`;
  }
  if (start) {
    return `${prefix}-${name}-${start}`;
  }
  return `${prefix}-${name}`;
}

/** Object key inside the `invoices` storage bucket (no bucket name prefix). */
export function buildInvoiceStoragePath(
  student: { student_name?: string | null },
  invoice: { period_start?: string | null; period_end?: string | null }
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const start = (invoice.period_start || '').replace(/-/g, '');
  const end = (invoice.period_end || '').replace(/-/g, '');
  const periodSlug = start && end ? `${start}_to_${end}` : `undated_${Date.now()}`;
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
  invoice: { period_start?: string | null; period_end?: string | null }
): string {
  const name = sanitizeInvoiceFilePart(student.student_name || 'Student');
  const start = invoice.period_start || '';
  const end = invoice.period_end || '';
  if (start && end) {
    return `Invoice_${name}_${start}_to_${end}.pdf`;
  }
  return `Invoice_${name}.pdf`;
}
