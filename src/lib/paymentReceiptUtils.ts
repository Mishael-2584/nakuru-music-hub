import { generatePaymentReceiptPDF, type PaymentReceiptData } from './pdfGenerator';
import {
  buildInvoiceDisplayNumber,
  buildPaymentReceiptDownloadFileName,
  buildPaymentReceiptNumber,
  formatInvoiceBillingMonth,
} from './invoiceNaming';
import { getEffectiveAmountDue, type InvoicePaymentRow } from './invoiceUtils';

function sortPaymentsChronologically(payments: InvoicePaymentRow[]): InvoicePaymentRow[] {
  return [...payments].sort((a, b) => {
    const dateA = a.paid_date || a.created_at || '';
    const dateB = b.paid_date || b.created_at || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.created_at || '').localeCompare(b.created_at || '');
  });
}

export function computePaymentReceiptTotals(
  payment: InvoicePaymentRow,
  invoice: Parameters<typeof getEffectiveAmountDue>[0],
  allPayments: InvoicePaymentRow[]
) {
  const amountDue = getEffectiveAmountDue(invoice);
  const sorted = sortPaymentsChronologically(allPayments);
  let cumulative = 0;
  for (const row of sorted) {
    cumulative += Number(row.amount) || 0;
    if (row.id === payment.id) break;
  }
  const totalPaidOnInvoice = cumulative;
  const balanceRemaining = Math.max(0, amountDue - cumulative);
  return { amountDue, totalPaidOnInvoice, balanceRemaining };
}

export function buildPaymentReceiptData(params: {
  payment: InvoicePaymentRow;
  invoice: {
    period_start?: string | null;
    period_end?: string | null;
    amount_due?: number | null;
    manual_amount_due?: number | null;
    manual_amount_override?: number | null;
    amount_paid?: number | null;
    payment_status?: string | null;
    status?: string | null;
  };
  student: {
    student_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  allPayments: InvoicePaymentRow[];
  isFirstInvoice?: boolean;
}): PaymentReceiptData {
  const { payment, invoice, student, allPayments, isFirstInvoice } = params;
  const { amountDue, totalPaidOnInvoice, balanceRemaining } = computePaymentReceiptTotals(
    payment,
    invoice,
    allPayments
  );
  const invoicePeriod = formatInvoiceBillingMonth(invoice);

  const thisPayment = Number(payment.amount) || 0;
  const cashAmount = Number(payment.cash_amount) || 0;
  const creditAmount = Number(payment.credit_amount) || 0;

  return {
    studentName: student.student_name || 'Student',
    studentEmail: student.email || '',
    studentPhone: student.phone || undefined,
    receiptNumber: buildPaymentReceiptNumber(student, payment),
    invoiceNumber: buildInvoiceDisplayNumber(student, invoice, isFirstInvoice),
    invoicePeriod,
    amountDue,
    amountPaid: thisPayment,
    cashAmount: cashAmount > 0 ? cashAmount : undefined,
    creditAmount: creditAmount > 0 ? creditAmount : undefined,
    totalPaidOnInvoice,
    balanceRemaining,
    isPartialPayment: balanceRemaining > 0,
    paymentMethod: payment.payment_method || 'cash',
    paidDate: payment.paid_date || new Date().toLocaleDateString('en-KE'),
    mpesaRef: payment.mpesa_transaction_id || undefined,
    notes: payment.notes || undefined,
  };
}

export async function generatePaymentReceiptPDFBlob(params: {
  payment: InvoicePaymentRow;
  invoice: Parameters<typeof buildPaymentReceiptData>[0]['invoice'];
  student: Parameters<typeof buildPaymentReceiptData>[0]['student'];
  allPayments: InvoicePaymentRow[];
  isFirstInvoice?: boolean;
}): Promise<Blob> {
  const receiptData = buildPaymentReceiptData(params);
  return generatePaymentReceiptPDF(receiptData);
}

export async function downloadPaymentReceiptPDF(params: {
  payment: InvoicePaymentRow;
  invoice: Parameters<typeof buildPaymentReceiptData>[0]['invoice'];
  student: Parameters<typeof buildPaymentReceiptData>[0]['student'];
  allPayments: InvoicePaymentRow[];
  isFirstInvoice?: boolean;
}): Promise<void> {
  const blob = await generatePaymentReceiptPDFBlob(params);
  const fileName = buildPaymentReceiptDownloadFileName(params.student, params.payment);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
