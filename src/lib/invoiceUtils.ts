import { supabase } from '../integrations/supabase/client';
import { generateQuotePDF } from './pdfGenerator';
import { Invoice } from '../integrations/supabase/types';
import { sendInvoiceEmail } from './emailService';
import {
  getTermlyFeeCourseType,
  getTermlyFeeCourseName,
  getDefaultTermPrice,
  getTermDurationPattern,
  getTermDisplayLabel,
  getTermScheduleNote,
  normalizeTermPeriod,
  TERMLY_FEE_MODE_ACADEMY,
} from './termlyFeeUtils';
import {
  buildInvoiceDisplayNumber,
  buildInvoiceDownloadFileName,
  buildInvoiceStoragePath,
  isBrokenInvoicePdfUrl,
} from './invoiceNaming';
import {
  buildLanguageInvoiceLineDescription,
  getLanguageDisplayName,
  getLanguageFeeCourseNameForPackage,
  getLanguageMonthlyPrice,
  isLanguagesCategory,
  LANGUAGE_FEE_MODE,
  normalizeLanguageSessionsPerWeek,
} from './languageCourseUtils';

export {
  sanitizeInvoiceFilePart,
  buildInvoiceDisplayNumber,
  buildInvoiceStoragePath,
  buildInvoiceDownloadFileName,
  isBrokenInvoicePdfUrl,
} from './invoiceNaming';

/** Local calendar date YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Current calendar month billing window (matches invoice generation for monthly students). */
export function getCalendarMonthPeriod(reference = new Date()): { start: string; end: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return { start: toLocalDateString(start), end: toLocalDateString(end) };
}

/** Parse YYYY-MM-DD as local calendar date (avoids UTC shift from `new Date('YYYY-MM-DD')`). */
export function parseLocalDateString(dateStr?: string | null): Date {
  if (!dateStr) return new Date(Number.NaN);
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Year-month key for billing comparisons (YYYY-MM). */
export function getYearMonthKey(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? parseLocalDateString(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * True when an invoice period starts after the reference calendar month.
 * Invoices should never be generated or shown as active billing beyond the current month.
 */
export function isFutureBillingPeriod(periodStart: string, reference = new Date()): boolean {
  return getYearMonthKey(periodStart) > getYearMonthKey(reference);
}

export type BillingPaymentType = 'monthly' | 'per_class' | 'term';

/** Sort invoices with the latest billing period first. */
export function sortInvoicesByPeriodEndDesc<T extends { period_end?: string | null }>(invoices: T[]): T[] {
  return [...invoices].sort((a, b) => {
    const aTime = parseLocalDateString(a.period_end).getTime();
    const bTime = parseLocalDateString(b.period_end).getTime();
    const safeA = Number.isNaN(aTime) ? 0 : aTime;
    const safeB = Number.isNaN(bTime) ? 0 : bTime;
    return safeB - safeA;
  });
}

export function getLatestInvoiceByPeriodEnd<T extends { period_end: string }>(
  invoices: T[]
): T | undefined {
  return sortInvoicesByPeriodEndDesc(invoices)[0];
}

/** Hide mistakenly generated future-month invoices from student/admin lists. */
export function filterInvoicesUpToCurrentMonth<T extends { period_start?: string | null }>(
  invoices: T[],
  reference = new Date()
): T[] {
  return invoices.filter((inv) => inv.period_start && !isFutureBillingPeriod(inv.period_start, reference));
}

/** Invoice history: only completed billing periods before the current calendar month. */
export function filterPastInvoicesForHistory<T extends { period_end: string; status?: string | null }>(
  invoices: T[],
  reference = new Date()
): T[] {
  const currentMonthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
  return invoices.filter((inv) => {
    if (inv.status === 'cancelled') return false;
    const periodEnd = parseLocalDateString(inv.period_end);
    return periodEnd < currentMonthStart;
  });
}

export function resolveInvoicePdfPaymentStatus(invoice: {
  status?: string | null;
  payment_status?: string | null;
}): string {
  if (invoice.payment_status === 'paid' || invoice.status === 'paid') return 'PAID';
  if (invoice.payment_status === 'partial') return 'PARTIAL';
  return 'PENDING';
}

export function computeNextBillingPeriod(params: {
  paymentType: BillingPaymentType;
  isFirstInvoice: boolean;
  registrationCreatedAt: string;
  lastPeriodEnd?: string | null;
  reference?: Date;
}): { periodStart: Date; periodEnd: Date } | null {
  const now = params.reference ?? new Date();
  const { paymentType, isFirstInvoice, registrationCreatedAt, lastPeriodEnd } = params;

  let periodStart: Date;
  let periodEnd: Date;

  if (paymentType === 'monthly' || paymentType === 'per_class') {
    if (isFirstInvoice) {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      if (!lastPeriodEnd) return null;
      const lastEnd = parseLocalDateString(lastPeriodEnd);
      periodStart = new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);
      periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
    }
  } else if (paymentType === 'term') {
    if (isFirstInvoice) {
      // Current term: calendar month start, three months through current billing window
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
      if (!lastPeriodEnd) return null;
      const lastEnd = parseLocalDateString(lastPeriodEnd);
      periodStart = new Date(lastEnd);
      periodStart.setDate(periodStart.getDate() + 1);
      periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 3);
      periodEnd.setDate(periodEnd.getDate() - 1);
    }
  } else {
    return null;
  }

  if (isFutureBillingPeriod(toLocalDateString(periodStart), now)) {
    return null;
  }

  return { periodStart, periodEnd };
}

export type InvoiceGenerationResult =
  | Invoice
  | { existing: Invoice }
  | { notDue: true; message: string };

export function isInvoiceNotDue(
  result: Invoice | { existing: Invoice } | { notDue: true; message: string } | null | undefined
): result is { notDue: true; message: string } {
  return !!result && typeof result === 'object' && 'notDue' in result;
}

export function extractInvoiceFromGenerationResult(
  result: InvoiceGenerationResult | null | undefined
): Invoice | null {
  if (!result) return null;
  if (isInvoiceNotDue(result)) return null;
  if ('existing' in result) return result.existing;
  return result;
}

/** After generation, pick the invoice to use (including current-month fallback when next period is not due). */
export async function resolveInvoiceAfterGeneration(
  studentId: string,
  result: InvoiceGenerationResult | null | undefined
): Promise<{ invoice: Invoice | null; isFirstInvoice: boolean; notice?: string }> {
  const direct = extractInvoiceFromGenerationResult(result);
  if (direct) {
    const { data: earlier } = await supabase
      .from('invoices')
      .select('id')
      .eq('student_id', studentId)
      .lt('period_start', direct.period_start)
      .limit(1);
    return { invoice: direct, isFirstInvoice: !earlier?.length };
  }

  if (isInvoiceNotDue(result)) {
    const { data } = await supabase.from('invoices').select('*').eq('student_id', studentId);
    const billable = filterInvoicesUpToCurrentMonth(data || []);
    const current = findInvoiceForCalendarMonth(billable, studentId);
    if (current) {
      const { data: earlier } = await supabase
        .from('invoices')
        .select('id')
        .eq('student_id', studentId)
        .lt('period_start', current.period_start)
        .limit(1);
      return {
        invoice: current as Invoice,
        isFirstInvoice: !earlier?.length,
        notice: result.message,
      };
    }
    return { invoice: null, notice: result.message };
  }

  return { invoice: null };
}

export type FutureInvoicePreviewRow = {
  invoice_id: string;
  student_id: string;
  student_name: string | null;
  period_start: string;
  period_end: string;
  amount_due: number;
  status: string;
  payment_status: string | null;
  has_payments: boolean;
  can_void: boolean;
};

export type VoidFutureInvoicesResult = {
  dry_run: boolean;
  future_count: number;
  voidable_count?: number;
  voided_count?: number;
  skipped_count: number;
  invoices?: FutureInvoicePreviewRow[];
};

function canVoidFutureInvoice(invoice: {
  status?: string | null;
  payment_status?: string | null;
  has_payments?: boolean;
}): boolean {
  const status = invoice.status ?? 'pending';
  if (status === 'paid' || status === 'cancelled') return false;
  if (invoice.payment_status === 'paid') return false;
  if (invoice.has_payments) return false;
  return true;
}

async function listFutureInvoicesClientSide(): Promise<FutureInvoicePreviewRow[]> {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, student_id, period_start, period_end, amount_due, status, payment_status, students(student_name)')
    .order('period_start', { ascending: false });

  if (error) throw error;

  const future = (invoices || []).filter(
    (inv) => isFutureBillingPeriod(inv.period_start) && inv.status !== 'cancelled'
  );
  if (!future.length) return [];

  const invoiceIds = future.map((inv) => inv.id);
  const { data: payments } = await supabase
    .from('payments')
    .select('invoice_id')
    .in('invoice_id', invoiceIds)
    .eq('status', 'completed');

  const paidInvoiceIds = new Set((payments || []).map((payment) => payment.invoice_id));

  return future.map((inv) => {
    const hasPayments = paidInvoiceIds.has(inv.id);
    const studentJoin = inv.students as { student_name?: string } | { student_name?: string }[] | null;
    const studentName = Array.isArray(studentJoin)
      ? studentJoin[0]?.student_name ?? null
      : studentJoin?.student_name ?? null;

    return {
      invoice_id: inv.id,
      student_id: inv.student_id,
      student_name: studentName,
      period_start: inv.period_start,
      period_end: inv.period_end,
      amount_due: Number(inv.amount_due) || 0,
      status: inv.status ?? 'pending',
      payment_status: inv.payment_status ?? null,
      has_payments: hasPayments,
      can_void: canVoidFutureInvoice({ ...inv, has_payments: hasPayments }),
    };
  });
}

export async function previewFutureInvoices(): Promise<FutureInvoicePreviewRow[]> {
  const { data, error } = await supabase.rpc('preview_future_invoices');
  if (!error && data) {
    return data as FutureInvoicePreviewRow[];
  }

  if (error?.message?.includes('preview_future_invoices')) {
    return listFutureInvoicesClientSide();
  }

  throw error;
}

export async function voidFutureInvoices(options?: {
  dryRun?: boolean;
}): Promise<VoidFutureInvoicesResult> {
  const dryRun = options?.dryRun ?? true;
  const { data, error } = await supabase.rpc('void_future_invoices', { p_dry_run: dryRun });

  if (!error && data) {
    return data as VoidFutureInvoicesResult;
  }

  if (!error?.message?.includes('void_future_invoices')) {
    throw error;
  }

  const invoices = await listFutureInvoicesClientSide();
  const voidable = invoices.filter((row) => row.can_void);
  const skippedCount = invoices.length - voidable.length;

  if (dryRun) {
    return {
      dry_run: true,
      future_count: invoices.length,
      voidable_count: voidable.length,
      skipped_count: skippedCount,
      invoices,
    };
  }

  const stamp = `[Voided: future billing period removed on ${toLocalDateString(new Date())}]`;
  let voidedCount = 0;

  for (const row of voidable) {
    const { data: current, error: fetchError } = await supabase
      .from('invoices')
      .select('notes')
      .eq('id', row.invoice_id)
      .single();
    if (fetchError) throw fetchError;

    const notes = current?.notes ? `${current.notes} ${stamp}` : stamp;
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'cancelled', notes, updated_at: new Date().toISOString() })
      .eq('id', row.invoice_id);
    if (updateError) throw updateError;
    voidedCount++;
  }

  return {
    dry_run: false,
    future_count: invoices.length,
    voided_count: voidedCount,
    skipped_count: skippedCount,
  };
}

/**
 * True when an invoice's date range overlaps the reference calendar month.
 * Handles non-standard periods (e.g. 2026-05-31 → 2026-06-29 still counts as June).
 */
export function invoiceOverlapsCalendarMonth(
  invoice: { period_start?: string | null; period_end?: string | null },
  reference: Date | string = new Date()
): boolean {
  if (!invoice.period_start || !invoice.period_end) return false;
  const ref = typeof reference === 'string' ? parseLocalDateString(reference) : reference;
  const { start, end } = getCalendarMonthPeriod(ref);
  const monthStart = parseLocalDateString(start);
  const monthEnd = parseLocalDateString(end);
  const invStart = parseLocalDateString(invoice.period_start);
  const invEnd = parseLocalDateString(invoice.period_end);
  return invStart <= monthEnd && invEnd >= monthStart;
}

export function findInvoiceForCalendarMonth<
  T extends { student_id: string; period_start: string; period_end: string }
>(invoices: T[], studentId: string, reference: Date | string = new Date()): T | undefined {
  return invoices.find(
    (inv) => inv.student_id === studentId && invoiceOverlapsCalendarMonth(inv, reference)
  );
}

/** Read-only: invoice for the current billing month (paid or unpaid). Never creates a row. */
export async function fetchStudentInvoiceForPreview(studentId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', studentId)
    .order('period_end', { ascending: false });

  if (error) throw error;

  const billable = filterInvoicesUpToCurrentMonth(data || []);
  const current = findInvoiceForCalendarMonth(billable, studentId);
  return (current as Invoice) ?? null;
}

export function invoiceMatchesFinancePeriod(
  invoice: { period_start?: string | null; period_end?: string | null },
  period: { start: string; end: string }
): boolean {
  if (!invoice.period_start || !invoice.period_end) return false;
  if (invoice.period_start === period.start && invoice.period_end === period.end) return true;
  return invoiceOverlapsCalendarMonth(invoice, period.start);
}

export function findInvoiceForFinancePeriod<T extends { student_id: string; period_start: string; period_end: string }>(
  invoices: T[],
  studentId: string,
  period: { start: string; end: string }
): T | undefined {
  return findInvoiceForCalendarMonth(invoices, studentId, period.start);
}

export function getLatestBillableInvoiceForStudent<
  T extends { student_id: string; period_start: string; period_end: string }
>(invoices: T[], studentId: string, reference = new Date()): T | undefined {
  return sortInvoicesByPeriodEndDesc(
    invoices.filter(
      (inv) => inv.student_id === studentId && !isFutureBillingPeriod(inv.period_start, reference)
    )
  )[0];
}

/** True when any payment has been recorded against this invoice. */
export function invoiceHasRecordedPayments(invoice: InvoicePaymentFields | null | undefined): boolean {
  if (!invoice) return false;
  if (getInvoiceAmountPaid(invoice) > 0) return true;
  if (invoice.payment_status === 'partial') return true;
  return false;
}

/** Student has no invoice overlapping the current calendar month. */
export function studentNeedsCurrentMonthInvoice<
  T extends { student_id: string; period_start: string; period_end: string }
>(invoices: T[], studentId: string, reference = new Date()): boolean {
  const billable = invoices.filter(
    (inv) => inv.student_id === studentId && !isFutureBillingPeriod(inv.period_start, reference)
  );
  return !findInvoiceForCalendarMonth(billable, studentId, reference);
}

/** Send Invoice is allowed unless the current calendar month is already fully paid. */
export function canSendInvoiceEmail<
  T extends { student_id: string; period_start: string; period_end: string } & InvoicePaymentFields
>(invoices: T[], studentId: string, reference = new Date()): boolean {
  const billable = invoices.filter(
    (inv) => inv.student_id === studentId && !isFutureBillingPeriod(inv.period_start, reference)
  );
  const current = findInvoiceForCalendarMonth(billable, studentId, reference);
  if (current && isInvoiceFullyPaid(current)) return false;
  return true;
}

/** Invoice to show in admin finances row (latest billable invoice for the student). */
export function resolveFinanceInvoiceForStudent<
  T extends { student_id: string; period_start: string; period_end: string } & InvoicePaymentFields
>(invoices: T[], studentId: string, period: { start: string; end: string }): {
  invoice: T | undefined;
  isCurrentPeriod: boolean;
} {
  const invoice = getLatestBillableInvoiceForStudent(invoices, studentId);
  const current = findInvoiceForCalendarMonth(
    invoices.filter(
      (inv) => inv.student_id === studentId && !isFutureBillingPeriod(inv.period_start)
    ),
    studentId
  );
  return {
    invoice,
    isCurrentPeriod: !!invoice && !!current && invoice.id === current.id,
  };
}

export type InvoicePaymentFields = {
  amount_due?: number | null;
  manual_amount_due?: number | null;
  manual_amount_override?: number | null;
  amount_paid?: number | null;
  payment_status?: string | null;
  status?: string | null;
};

/** Effective amount due (respects admin overrides). */
export function getEffectiveAmountDue(invoice: InvoicePaymentFields | null | undefined): number {
  if (!invoice) return 0;
  const manualDue = invoice.manual_amount_due;
  const manualOverride = invoice.manual_amount_override;
  const base = invoice.amount_due ?? 0;
  if (manualDue !== null && manualDue !== undefined && !Number.isNaN(Number(manualDue))) {
    return Number(manualDue);
  }
  if (manualOverride !== null && manualOverride !== undefined && !Number.isNaN(Number(manualOverride))) {
    return Number(manualOverride);
  }
  return Number(base) || 0;
}

export function getInvoiceAmountPaid(invoice: InvoicePaymentFields | null | undefined): number {
  if (!invoice) return 0;
  const paid = invoice.amount_paid;
  if (paid === null || paid === undefined || Number.isNaN(Number(paid))) return 0;
  return Number(paid);
}

export function getInvoiceBalanceRemaining(invoice: InvoicePaymentFields | null | undefined): number {
  return Math.max(0, getEffectiveAmountDue(invoice) - getInvoiceAmountPaid(invoice));
}

export function isInvoiceFullyPaid(invoice: InvoicePaymentFields | null | undefined): boolean {
  if (!invoice) return false;
  if (invoice.payment_status === 'paid' || invoice.status === 'paid') return true;
  return getInvoiceBalanceRemaining(invoice) <= 0 && getInvoiceAmountPaid(invoice) > 0;
}

/** True when invoice still owes money (ignores sent/partial status quirks). */
export function hasOutstandingBalance(invoice: InvoicePaymentFields | null | undefined): boolean {
  if (!invoice) return false;
  const status = invoice.status ?? '';
  if (status === 'paid' || status === 'cancelled' || status === 'excused') return false;
  return getInvoiceBalanceRemaining(invoice) > 0;
}

export function formatInvoicePaymentSummary(invoice: InvoicePaymentFields | null | undefined): string {
  const due = getEffectiveAmountDue(invoice);
  const paid = getInvoiceAmountPaid(invoice);
  const balance = getInvoiceBalanceRemaining(invoice);
  return `Paid ${paid.toLocaleString()} / ${due.toLocaleString()} — Balance ${balance.toLocaleString()}`;
}

export interface RecordInvoicePaymentResult {
  payment_id: string | null;
  invoice_id: string;
  applied_to_invoice: number;
  overpayment_credit: number;
  credit_used: number;
  cash_applied: number;
  balance_remaining: number;
  payment_status: string;
  amount_paid: number;
  effective_due: number;
  student_credit_balance: number;
  became_paid: boolean;
  student_id: string;
}

export async function recordInvoicePayment(params: {
  invoiceId: string;
  cashAmount: number;
  creditAmount?: number;
  paymentMethod?: string;
  mpesaTransactionId?: string;
  payerPhone?: string;
  paidDate?: string;
  notes?: string;
  recordedBy?: string;
}): Promise<RecordInvoicePaymentResult> {
  const { data, error } = await supabase.rpc('record_invoice_payment', {
    p_invoice_id: params.invoiceId,
    p_cash_amount: params.cashAmount,
    p_credit_amount: params.creditAmount ?? 0,
    p_payment_method: params.paymentMethod ?? 'cash',
    p_mpesa_transaction_id: params.mpesaTransactionId ?? null,
    p_payer_phone: params.payerPhone ?? null,
    p_paid_date: params.paidDate ?? toLocalDateString(new Date()),
    p_notes: params.notes ?? null,
    p_recorded_by: params.recordedBy ?? null,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('record_invoice_payment') || msg.includes('Could not find the function')) {
      throw new Error(
        'Payment recording is not available yet. Apply the database migration 20260523000001_partial_payments_and_credits.sql in Supabase, then try again.'
      );
    }
    throw error;
  }
  return data as RecordInvoicePaymentResult;
}

export async function fetchStudentCreditBalance(studentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_student_credit_balance', {
    p_student_id: studentId,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('get_student_credit_balance') || msg.includes('Could not find the function')) {
      return 0;
    }
    throw error;
  }
  return Number(data) || 0;
}

export interface InvoicePaymentRow {
  id: string;
  invoice_id?: string | null;
  amount: number;
  cash_amount?: number | null;
  credit_amount?: number | null;
  payment_method?: string | null;
  status?: string | null;
  paid_date?: string | null;
  mpesa_transaction_id?: string | null;
  notes?: string | null;
  created_at?: string | null;
}

export async function fetchInvoicePayments(invoiceId: string): Promise<InvoicePaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, cash_amount, credit_amount, payment_method, status, paid_date, mpesa_transaction_id, notes, created_at')
    .eq('invoice_id', invoiceId)
    .eq('status', 'completed')
    .order('paid_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvoicePaymentRow[];
}

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

// Real-time currency conversion using Exchange Rate API
async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  try {
    // Use Exchange Rate API (free tier)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    
    if (!response.ok) {
      console.warn(`Failed to fetch exchange rate from ${fromCurrency} to ${toCurrency}, using fallback rate`);
      // Fallback rates (updated periodically)
      const fallbackRates: { [key: string]: number } = {
        'USD_KES': 150.5, // 1 USD = 150.5 KES (approximate)
        'EUR_KES': 165.2, // 1 EUR = 165.2 KES (approximate)
        'GBP_KES': 192.8, // 1 GBP = 192.8 KES (approximate)
      };
      
      const rateKey = `${fromCurrency}_${toCurrency}`;
      return fallbackRates[rateKey] || 150.5; // Default to USD_KES rate
    }
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) {
      console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using fallback rate`);
      return 150.5; // Default fallback
    }
    
    console.log(`Real-time exchange rate: 1 ${fromCurrency} = ${rate} ${toCurrency}`);
    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    console.warn('Using fallback exchange rate');
    return 150.5; // Default fallback rate
  }
}

// Cache exchange rates to avoid excessive API calls
const exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

// Separate cache for admin-configured FX overrides (kept short so updates take effect quickly)
const ADMIN_OVERRIDE_CACHE_DURATION_MS = 60 * 1000; // 1 minute
let adminUsdToKesOverrideCache: { rate: number; timestamp: number } | null = null;

async function getAdminUsdToKesRateFromSettings(): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('exchange_rate_settings')
      .select('rate')
      .eq('from_currency', 'USD')
      .eq('to_currency', 'KES')
      .maybeSingle();

    if (error || !data) return null;
    const rate = typeof data.rate === 'string' ? parseFloat(data.rate) : Number(data.rate);
    if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
    return rate;
  } catch (e) {
    console.error('Failed to load admin USD->KES FX rate:', e);
    return null;
  }
}

async function getCachedExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  const effectiveFrom = fromCurrency === '$' ? 'USD' : fromCurrency;
  const cacheKey = `${effectiveFrom}_${toCurrency}`;
  const now = Date.now();
  
  // Check if we have a cached rate that's still valid
  const cached = exchangeRateCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached exchange rate: 1 ${fromCurrency} = ${cached.rate} ${toCurrency}`);
    return cached.rate;
  }
  
  // Admin override: use admin-configured USD->KES rate for "$" fees
  if (toCurrency === 'KES' && effectiveFrom === 'USD') {
    // Try override cache first
    if (adminUsdToKesOverrideCache && (now - adminUsdToKesOverrideCache.timestamp) < ADMIN_OVERRIDE_CACHE_DURATION_MS) {
      return adminUsdToKesOverrideCache.rate;
    }

    const overrideRate = await getAdminUsdToKesRateFromSettings();
    if (overrideRate) {
      adminUsdToKesOverrideCache = { rate: overrideRate, timestamp: now };
      // Also seed the general exchange-rate cache so repeated calls are fast
      exchangeRateCache.set(cacheKey, { rate: overrideRate, timestamp: now });
      console.log(`Using admin FX override: 1 USD = ${overrideRate} KES`);
      return overrideRate;
    }
    // If override isn't set, fall back to live API below
  }

  // Fetch new rate from live API
  const rate = await getExchangeRate(effectiveFrom, toCurrency);
  
  // Cache the new rate
  exchangeRateCache.set(cacheKey, {
    rate,
    timestamp: now
  });
  
  return rate;
}

const MUSIC_MONTHLY_SESSIONS_PER_MONTH = 4;

/** Check whether a public invoice PDF URL actually returns a file. */
export async function isInvoicePdfUrlAccessible(pdfUrl: string): Promise<boolean> {
  if (isBrokenInvoicePdfUrl(pdfUrl)) return false;
  try {
    const res = await fetch(pdfUrl, { method: 'GET' });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('pdf') || contentType.includes('octet-stream');
  } catch {
    return false;
  }
}

/** Open invoice PDF preview in a new tab with a proper filename (not a random UUID). */
export function openInvoicePdfPreview(
  blob: Blob,
  student: { student_name?: string | null },
  invoice: { period_start?: string | null; period_end?: string | null }
): void {
  const fileName = buildInvoiceDownloadFileName(student, invoice);
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const url = URL.createObjectURL(file);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

/** Trigger a direct download with the student's name as the filename. */
export function downloadInvoicePdfBlob(
  blob: Blob,
  student: { student_name?: string | null },
  invoice: { period_start?: string | null; period_end?: string | null }
): void {
  const fileName = buildInvoiceDownloadFileName(student, invoice);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Download/open a PDF using the student's name as the filename. */
export async function openInvoicePdfWithName(
  pdfUrl: string,
  student: { student_name?: string | null },
  invoice: { period_start?: string | null; period_end?: string | null }
): Promise<void> {
  const downloadName = buildInvoiceDownloadFileName(student, invoice);
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
    const blob = await res.blob();
    if (blob.type && blob.type.includes('json')) {
      throw new Error('PDF link returned an error instead of a file');
    }
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not download invoice PDF');
  }
}

type FeeRecord = {
  id: string;
  price: number;
  duration?: string | null;
  hours_per_session?: number | null;
  mode?: string | null;
  payment_type?: string | null;
  sessions_per_week?: number | null;
  currency?: string | null;
  course_type?: string | null;
  course_name?: string | null;
  is_active?: boolean;
};

/** When several monthly music fees share the same mode, pick the row that matches the student's plan. */
export function pickBestMusicMonthlyFee(
  fees: FeeRecord[],
  registration: { home_lesson_duration?: string | null; learning_mode?: string | null }
): FeeRecord | null {
  if (!fees.length) return null;
  const lm = String(registration.learning_mode || '').toLowerCase();
  const isHome = lm === 'home' || lm.includes('home');

  if (isHome) {
    if (registration.home_lesson_duration === '30_min') {
      return fees.find((f) => (f.duration || '').toLowerCase().includes('30')) ?? fees[0];
    }
    if (registration.home_lesson_duration === '1_hour') {
      return (
        fees.find((f) => (f.duration || '').toLowerCase().includes('1 hour')) ?? fees[0]
      );
    }
  }

  return (
    fees.find((f) => (f.duration || '').toLowerCase().includes('1 hour')) ||
    fees.reduce((best, f) =>
      (Number(f.hours_per_session) || 0) > (Number(best.hours_per_session) || 0) ? f : best
    )
  );
}

/** Published monthly rates (1 session/week plan); multiplied by registration sessions_per_week. */
export function resolveMusicMonthlyTotalKes(
  registration: {
    learning_mode?: string | null;
    home_lesson_duration?: string | null;
    sessions_per_week?: number | string | null;
  },
  convertedOnlineMonthlyKes: number
): number {
  const lm = String(registration.learning_mode || '').toLowerCase();
  const sessions = Math.max(
    1,
    registration.sessions_per_week ? parseInt(String(registration.sessions_per_week), 10) : 1
  );

  if (lm === 'home' || lm.includes('home')) {
    const base = registration.home_lesson_duration === '1_hour' ? 12000 : 6000;
    return base * sessions;
  }
  if (lm === 'online') {
    return Math.round(convertedOnlineMonthlyKes * sessions);
  }
  return 6000 * sessions;
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
 * @param isFirstInvoice - Whether this is the first invoice for the student
 * @returns The public URL of the uploaded PDF
 */
export async function generateAndUploadInvoicePDF(invoice: any, student: any, isFirstInvoice: boolean = false): Promise<string> {
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

  // Debug: log due date before passing to PDF
  console.log('PDF Generation: invoice.due_date =', invoice.due_date);
  // Build invoiceMeta for the new PDF layout
  const invoiceMeta = {
    invoiceNumber: buildInvoiceDisplayNumber(student, invoice, isFirstInvoice),
    periodStart: invoice.period_start || '',
    periodEnd: invoice.period_end || '',
    dueDate: invoice.due_date || '',
    paymentStatus: resolveInvoicePdfPaymentStatus(invoice),
    studentId: student.id || '',
    registrationId: student.registration_id || '',
    sessionsPerWeek: invoice.sessions_per_week || undefined,
    notes: invoice.notes || '',
  };
  // Debug: log invoiceMeta before PDF generation
  console.log('PDF Generation: invoiceMeta =', invoiceMeta);

  // Generate PDF blob with new layout
  const pdfBlob = await generateQuotePDF(quoteData, invoice.amount_due, '', invoiceDetails, invoiceMeta);
  // Upload to Supabase Storage
  const fileName = buildInvoiceStoragePath(student, invoice);
  const { error } = await supabase.storage.from('invoices').upload(fileName, pdfBlob, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (error) {
    const sizeMb = (pdfBlob.size / (1024 * 1024)).toFixed(2);
    if (error.message?.toLowerCase().includes('maximum allowed size')) {
      throw new Error(
        `PDF is too large to upload (${sizeMb} MB). Run supabase db push to update the invoices bucket limit, then try again.`
      );
    }
    throw error;
  }
  // Get public URL
  const { publicUrl } = supabase.storage.from('invoices').getPublicUrl(fileName).data;
  return publicUrl;
}

/** Generate invoice PDF blob for preview/download without uploading. */
export async function generateInvoicePDFBlob(invoice: any, student: any, isFirstInvoice: boolean = false): Promise<Blob> {
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
  const invoiceMeta = {
    invoiceNumber: buildInvoiceDisplayNumber(student, invoice, isFirstInvoice),
    periodStart: invoice.period_start || '',
    periodEnd: invoice.period_end || '',
    dueDate: invoice.due_date || '',
    paymentStatus: resolveInvoicePdfPaymentStatus(invoice),
    studentId: student.id || '',
    registrationId: student.registration_id || '',
    sessionsPerWeek: invoice.sessions_per_week || undefined,
    notes: invoice.notes || '',
  };
  return generateQuotePDF(quoteData, invoice.amount_due, '', invoiceDetails, invoiceMeta);
}

/** Build PDF line items when older invoices lack lessons_summary. */
export function buildFallbackLessonsSummary(invoice: {
  amount_due: number;
  period_start?: string;
  period_end?: string;
  notes?: string | null;
}) {
  const amount = Number(invoice.amount_due) || 0;
  const periodLabel =
    invoice.period_start && invoice.period_end
      ? `${invoice.period_start} to ${invoice.period_end}`
      : 'billing period';

  return {
    lineItems: [
      {
        description: `Music lessons — ${periodLabel}`,
        quantity: 1,
        unitPrice: amount,
        amount,
        lessonIds: [] as string[],
      },
    ],
    subtotal: amount,
    tax: 0,
    total: amount,
    paymentTerms: 'Payment due within 7 days of invoice date',
    validUntil: '',
    serviceBreakdown: 'Music lessons as scheduled',
    equipmentBreakdown: 'All necessary equipment and materials provided',
    additionalInfo: invoice.notes || 'Please contact us if you have any questions about this invoice.',
  };
}

/**
 * Generate PDF for an invoice, upload to storage, save pdf_url on the row.
 * Safe to call for historical invoices that never had a PDF.
 */
export async function ensureInvoicePDF(
  invoice: Record<string, unknown>,
  student: Record<string, unknown>
): Promise<string> {
  const existingUrl =
    invoice.pdf_url && typeof invoice.pdf_url === 'string' ? invoice.pdf_url : null;

  if (existingUrl && !isBrokenInvoicePdfUrl(existingUrl)) {
    const accessible = await isInvoicePdfUrlAccessible(existingUrl);
    if (accessible) {
      return existingUrl;
    }
  }

  const studentId = student.id as string;
  const invoiceId = invoice.id as string;

  const { data: earliest, error: earliestError } = await supabase
    .from('invoices')
    .select('id')
    .eq('student_id', studentId)
    .order('period_start', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (earliestError) {
    console.warn('Could not determine first invoice:', earliestError);
  }

  const isFirstInvoice = earliest?.id === invoiceId;

  const invoiceForPdf = {
    ...invoice,
    lessons_summary:
      invoice.lessons_summary || buildFallbackLessonsSummary(invoice as Parameters<typeof buildFallbackLessonsSummary>[0]),
  };

  const pdfUrl = await generateAndUploadInvoicePDF(invoiceForPdf, student, isFirstInvoice);

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
    .eq('id', invoiceId);

  if (updateError) {
    throw new Error(`PDF created but failed to save link: ${updateError.message}`);
  }

  return pdfUrl;
}

// Add defensive check utility function
const isValidId = (id: any) => id && id !== 'undefined' && id !== undefined && id !== null;

/**
 * Generate an invoice for a given registration.
 * @param registrationId - The registration UUID
 * @returns The created Invoice object
 */
export async function generateInvoiceForRegistration(
  registrationId: string
): Promise<InvoiceGenerationResult | null> {
  // Defensive check for registration ID
  if (!isValidId(registrationId)) {
    console.error('Invalid registration ID for invoice generation:', registrationId);
    throw new Error('Invalid registration ID');
  }

  // Fetch registration, student, and fee info
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', registrationId)
    .single();
  if (regError || !registration) throw regError || new Error('Registration not found');

  // Find the student for this registration using registration_id
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('registration_id', registrationId)
    .single();
  
  if (studentError || !student) {
    console.error('Student not found for registration:', registrationId);
    throw new Error('Student not found for registration');
  }

  // Defensive check for student ID
  if (!isValidId(student.id)) {
    console.error('Student missing valid ID:', student);
    throw new Error('Student missing valid ID');
  }

  // Find the matching fee with proper fallback logic based on student preferences
  let fee = null;
  let feeError = null;
  
  // Get student preferences from registration
  const learningMode = registration.learning_mode || 'in-person';
  const courseCategory = registration.course_category || 'Music';
  const courseCategoryLower = String(courseCategory).toLowerCase();
  const instrument = registration.instrument;
  
  console.log('Looking for fee with preferences:', {
    courseCategory,
    instrument,
    learningMode
  });
  
  // Determine payment type based on course category (case-insensitive)
  let paymentType = 'monthly'; // Default
  if (courseCategoryLower === 'production' || courseCategoryLower === 'photography') {
    paymentType = 'term';
  } else if (courseCategoryLower === 'technology') {
    paymentType = 'per_class'; // Technology courses use per_class billing
  } else if (courseCategoryLower === 'languages') {
    paymentType = 'monthly';
  }
  
  console.log('Determined payment type:', paymentType, 'for course category:', courseCategory);
  
  // Normalize learning mode for database matching
  const normalizeLearningMode = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'online':
        return 'Online (Global)';
      case 'home':
      case 'home (nakuru & environs)':
        return 'Home (Nakuru & Environs)';
      case 'in-person':
      case 'physical':
      case 'at the academy':
        return 'At the Academy';
      default:
        return mode;
    }
  };
  
  const normalizedLearningMode = normalizeLearningMode(learningMode);
  console.log('Normalized learning mode:', normalizedLearningMode);
  
  let normalizedCourseCategory = courseCategoryLower || 'music';
  let normalizedInstrument = instrument;
  if (normalizedCourseCategory === 'art') {
    normalizedInstrument = 'Art Classes';
  } else if (normalizedCourseCategory === 'technology') {
    normalizedInstrument = registration.technology_type || 'Web Design & Programming';
  } else if (normalizedCourseCategory === 'languages') {
    normalizedInstrument = getLanguageFeeCourseNameForPackage(registration.language_package);
  } else if (normalizedCourseCategory === 'music') {
    normalizedInstrument = 'Instrumental & Music Theory';
  } else if (normalizedCourseCategory === 'production' || normalizedCourseCategory === 'photography') {
    normalizedCourseCategory = getTermlyFeeCourseType(
      registration.course_category,
      registration.production_type
    );
    normalizedInstrument = getTermlyFeeCourseName(registration.course_category, registration);
  }

  const termPeriod =
    paymentType === 'term'
      ? normalizeTermPeriod(registration.term_period)
      : null;

  const applyTermFeeFilters = (query: ReturnType<typeof supabase.from>) => {
    let q = query
      .eq('course_type', normalizedCourseCategory)
      .eq('course_name', normalizedInstrument)
      .eq('payment_type', paymentType)
      .eq('is_active', true);
    if (paymentType === 'term' && termPeriod) {
      q = q.ilike('duration', getTermDurationPattern(termPeriod));
    }
    return q;
  };

  // Termly: try requested learning mode, then academy (term fees are usually academy-priced)
  let exactFee: typeof fee = null;
  let exactFeeError: typeof feeError = null;
  if (paymentType === 'term') {
    for (const mode of [normalizedLearningMode, TERMLY_FEE_MODE_ACADEMY]) {
      const { data, error } = await applyTermFeeFilters(
        supabase.from('fees').select('*').eq('mode', mode)
      ).maybeSingle();
      if (data && !error) {
        exactFee = data;
        break;
      }
    }
  } else if (normalizedCourseCategory === 'languages' && paymentType === 'monthly') {
    const courseName = getLanguageFeeCourseNameForPackage(registration.language_package);
    const spw = normalizeLanguageSessionsPerWeek(registration.sessions_per_week);
    const { data: langFee, error: langFeeError } = await supabase
      .from('fees')
      .select('*')
      .eq('course_type', 'languages')
      .eq('course_name', courseName)
      .eq('payment_type', 'monthly')
      .eq('mode', LANGUAGE_FEE_MODE)
      .eq('sessions_per_week', spw)
      .eq('is_active', true)
      .maybeSingle();
    if (langFee && !langFeeError) {
      exactFee = langFee;
    } else {
      exactFeeError = langFeeError;
    }
  } else {
    const { data: feeRows, error: feeRowsError } = await applyTermFeeFilters(
      supabase.from('fees').select('*').eq('mode', normalizedLearningMode)
    );
    if (feeRowsError) {
      exactFeeError = feeRowsError;
    } else if (feeRows?.length === 1) {
      exactFee = feeRows[0];
    } else if (feeRows && feeRows.length > 1 && normalizedCourseCategory === 'music' && paymentType === 'monthly') {
      exactFee = pickBestMusicMonthlyFee(feeRows, registration);
      console.log('Picked music monthly fee from multiple rows:', exactFee);
    } else if (feeRows?.length) {
      exactFee = feeRows[0];
    }
  }

  if (exactFee && !exactFeeError) {
    fee = exactFee;
    console.log('Found exact fee match with learning mode and payment type:', fee);
  } else {
    console.log('No exact fee match found, trying fallback options');
    
    // Fallback 1: course + program name + mode (+ term for termly)
    let modeFeeQuery = supabase
      .from('fees')
      .select('*')
      .eq('course_type', normalizedCourseCategory)
      .eq('course_name', normalizedInstrument)
      .eq('mode', normalizedLearningMode)
      .eq('payment_type', paymentType)
      .eq('is_active', true);
    if (paymentType === 'term' && termPeriod) {
      modeFeeQuery = modeFeeQuery.ilike('duration', getTermDurationPattern(termPeriod));
    }
    let { data: modeFeeRows, error: modeFeeError } = await modeFeeQuery;
    let modeFee =
      modeFeeRows?.length === 1
        ? modeFeeRows[0]
        : modeFeeRows && modeFeeRows.length > 1 && normalizedCourseCategory === 'music' && paymentType === 'monthly'
          ? pickBestMusicMonthlyFee(modeFeeRows, registration)
          : modeFeeRows?.[0] ?? null;
    if ((!modeFee || modeFeeError) && paymentType === 'term') {
      const academyTry = await applyTermFeeFilters(
        supabase.from('fees').select('*').eq('mode', TERMLY_FEE_MODE_ACADEMY)
      ).maybeSingle();
      modeFee = academyTry.data;
      modeFeeError = academyTry.error;
    }

    if (modeFee && !modeFeeError) {
      fee = modeFee;
      console.log('Found fee by course_type and learning_mode with payment type:', fee);
    } else {
      let typeFeeQuery = supabase
        .from('fees')
        .select('*')
        .eq('course_type', normalizedCourseCategory)
        .eq('course_name', normalizedInstrument)
        .eq('payment_type', paymentType)
        .eq('is_active', true);
      if (paymentType === 'term' && termPeriod) {
        typeFeeQuery = typeFeeQuery.ilike('duration', getTermDurationPattern(termPeriod));
      }
      const { data: typeFee, error: typeFeeError } = await typeFeeQuery.maybeSingle();
      
      if (typeFee && !typeFeeError) {
        fee = typeFee;
        console.log('Found fee by course_type only with payment type:', fee);
      } else {
        // Fallback 3: For Technology courses, prioritize 1-on-1 fee
        if (normalizedCourseCategory === 'technology' && paymentType === 'per_class') {
          const { data: techFee, error: techFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('course_type', 'technology')
            .eq('course_name', registration.technology_type || 'Web Design & Programming')
            .eq('payment_type', 'per_class')
            .eq('is_active', true)
            .order('price', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (techFee && !techFeeError) {
            fee = techFee;
            console.log('Found Technology per_class fee:', fee);
          }
        } else if (normalizedCourseCategory === 'languages' && paymentType === 'monthly') {
          const courseName = getLanguageFeeCourseNameForPackage(registration.language_package);
          const spw = normalizeLanguageSessionsPerWeek(registration.sessions_per_week);
          const { data: langFee, error: langFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('course_type', 'languages')
            .eq('course_name', courseName)
            .eq('payment_type', 'monthly')
            .eq('mode', LANGUAGE_FEE_MODE)
            .eq('sessions_per_week', spw)
            .eq('is_active', true)
            .maybeSingle();

          if (langFee && !langFeeError) {
            fee = langFee;
            console.log('Found Languages monthly fee:', fee);
          }
        } else if (paymentType === 'term') {
          const { data: termFee, error: termFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('course_type', normalizedCourseCategory)
            .eq('course_name', normalizedInstrument)
            .eq('payment_type', 'term')
            .ilike('duration', getTermDurationPattern(termPeriod || '1st_term'))
            .eq('is_active', true)
            .maybeSingle();
          
          if (termFee && !termFeeError) {
            fee = termFee;
            console.log('Found term fee for course category:', fee);
          }
        }
        
        // Fallback 5: Try to find any fee for the normalized learning mode with correct payment type
        if (!fee) {
          const { data: modeAnyFee, error: modeAnyFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('mode', normalizedLearningMode)
            .eq('payment_type', paymentType)
            .eq('is_active', true)
            .maybeSingle();
          
          if (modeAnyFee && !modeAnyFeeError) {
            fee = modeAnyFee;
            console.log('Found fee for learning mode with payment type:', fee);
          }
        }
        
        // Fallback 6: Try to find any active fee with correct payment type
        if (!fee) {
          const { data: anyFee, error: anyFeeError } = await supabase
            .from('fees')
            .select('*')
            .eq('payment_type', paymentType)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          if (anyFee && !anyFeeError) {
            fee = anyFee;
            console.log('Found fallback fee with payment type:', fee);
          }
        }
        
        // Fallback 6: If still no fee found, fetch all active fees to get real rates
        if (!fee) {
          console.log('No fee found with fallbacks, fetching all active fees for real rates');
          const { data: allFees, error: allFeesError } = await supabase
            .from('fees')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true });
          
          if (allFeesError) {
            console.error('Error fetching all fees:', allFeesError);
            throw allFeesError;
          }
          
          if (allFees && allFees.length > 0) {
            // Find the most appropriate fee based on course category and payment type
            let bestMatch = null;
            
            // First try to find by course category
            bestMatch = allFees.find(f => f.course_type === normalizedCourseCategory);
            
            // If no match by course category, find by payment type
            if (!bestMatch) {
              bestMatch = allFees.find(f => f.payment_type === paymentType);
            }
            
            // If still no match, use the first available fee
            if (!bestMatch) {
              bestMatch = allFees[0];
            }
            
            fee = bestMatch;
            console.log('Using real fee from database as fallback:', fee);
          }
        }
        
        // Fallback 7: Last resort - create a default fee structure based on real market rates
        if (!fee) {
          console.log('No fees found in database, creating default fee structure');
          let defaultPrice = 5000; // Default in KES
          let defaultCurrency = 'KSh';
          
          if (paymentType === 'term') {
            defaultPrice = getDefaultTermPrice(
              registration.course_category,
              registration,
              termPeriod || '1st_term'
            );
          } else if (isLanguagesCategory(registration.course_category)) {
            defaultPrice = getLanguageMonthlyPrice(registration.language_package, registration.sessions_per_week);
            defaultCurrency = '$';
          } else if (learningMode === 'online') {
            defaultPrice = 44; // $44 USD
            defaultCurrency = '$';
          } else if (learningMode === 'home' || normalizedLearningMode === 'Home (Nakuru & Environs)') {
            const dur = registration.home_lesson_duration;
            defaultPrice = (dur === '30_min' || dur === '1_hour') ? (dur === '30_min' ? 6000 : 12000) : 12000; // 30 min = 6,000; 1 hr = 12,000
          } else {
            defaultPrice = 6000; // KES 6,000 for academy lessons
          }
          
          fee = {
            id: 'default',
            course_type: normalizedCourseCategory,
            course_name: normalizedInstrument,
            price: defaultPrice,
            currency: defaultCurrency,
            payment_type: paymentType,
            mode: learningMode,
            sessions_per_week: paymentType === 'term' ? 3 : 1,
            is_active: true
          };
          console.log('Using default fee structure based on real market rates:', fee);
        }
      }
    }
  }
  
  if (!fee) {
    console.error('No fee found and could not create default fee');
    throw new Error('Fee not found for registration and no fallback available');
  }
  
  // Convert foreign currency to KES using real-time exchange rates
  console.log('💰 Currency conversion check:', {
    feeCurrency: fee.currency,
    feePrice: fee.price,
    needsConversion: fee.currency && fee.currency !== 'KSh' && fee.price
  });
  
  if (fee.currency && fee.currency !== 'KSh' && fee.price) {
    try {
      const exchangeRate = await getCachedExchangeRate(fee.currency, 'KES');
      const originalPrice = fee.price;
      fee.price = Math.round(fee.price * exchangeRate * 100) / 100; // Round to 2 decimal places
      fee.currency = 'KSh';
      console.log(`✅ Converted ${originalPrice} ${fee.currency} to KES: ${fee.price} KSh (rate: 1 ${fee.currency} = ${exchangeRate} KES)`);
    } catch (error) {
      console.error('❌ Error converting currency:', error);
      // Use 128 as fallback rate as requested
      const fallbackRate = 128;
      fee.price = Math.round(fee.price * fallbackRate * 100) / 100;
      fee.currency = 'KSh';
      console.log(`🔄 Used fallback rate for ${fee.currency}: ${fee.price} KSh`);
    }
  }

  const isHomeMusic =
    courseCategoryLower === 'music' &&
    (learningMode === 'home' ||
      learningMode === 'home-lessons' ||
      normalizedLearningMode === 'Home (Nakuru & Environs)');
  const homeDuration = registration.home_lesson_duration;

  // Music monthly: use published flat monthly totals (fixes legacy 5,600 academy row → 6,000)
  if (courseCategoryLower === 'music' && fee.payment_type === 'monthly') {
    const sessions = Math.max(
      1,
      registration.sessions_per_week ? parseInt(String(registration.sessions_per_week), 10) : 1
    );
    const monthlyTotal = resolveMusicMonthlyTotalKes(registration, fee.price);
    fee = { ...fee, price: monthlyTotal / sessions, sessions_per_week: 1 };
    console.log('Music monthly pricing applied:', {
      monthlyTotal,
      sessionsPerWeek: sessions,
      feePricePerPlan: fee.price,
      learningMode,
      home_lesson_duration: homeDuration,
    });
  } else if (isHomeMusic && (homeDuration === '30_min' || homeDuration === '1_hour')) {
    fee = { ...fee, price: homeDuration === '30_min' ? 6000 : 12000 };
    console.log('Home lesson duration pricing applied:', { home_lesson_duration: homeDuration, price: fee.price });
  }

  const now = new Date();

  const { data: existingInvoices, error: existingInvoicesError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id);

  if (existingInvoicesError) {
    console.error('Error checking existing invoices:', existingInvoicesError);
    throw existingInvoicesError;
  }

  const billableExistingInvoices = filterInvoicesUpToCurrentMonth(existingInvoices || [], now);
  const isFirstInvoice = billableExistingInvoices.length === 0;
  const latestInvoice = getLatestInvoiceByPeriodEnd(billableExistingInvoices);
  paymentType = fee.payment_type as BillingPaymentType;

  const currentMonthInvoice = findInvoiceForCalendarMonth(billableExistingInvoices, student.id, now);
  if (currentMonthInvoice) {
    return { existing: currentMonthInvoice as Invoice };
  }

  if (latestInvoice && isInvoiceFullyPaid(latestInvoice)) {
    const nextPeriodCheck = computeNextBillingPeriod({
      paymentType,
      isFirstInvoice: false,
      registrationCreatedAt: registration.created_at,
      lastPeriodEnd: latestInvoice.period_end,
      reference: now,
    });
    if (!nextPeriodCheck) {
      return { existing: latestInvoice as Invoice };
    }
  }

  console.log('📅 Billing period calculation:', {
    isFirstInvoice,
    existingInvoicesCount: existingInvoices?.length || 0,
    billableInvoicesCount: billableExistingInvoices.length,
    latestPeriodEnd: latestInvoice?.period_end ?? null,
    currentDate: toLocalDateString(now),
    paymentType,
  });

  const nextPeriod = computeNextBillingPeriod({
    paymentType,
    isFirstInvoice,
    registrationCreatedAt: registration.created_at,
    lastPeriodEnd: latestInvoice?.period_end ?? null,
    reference: now,
  });

  if (!nextPeriod) {
    if (latestInvoice) {
      return { existing: latestInvoice as Invoice };
    }
    return {
      notDue: true,
      message:
        'No invoice is due yet. Billing only runs through the current calendar month; the next period will open when that month begins.',
    };
  }

  const { periodStart, periodEnd } = nextPeriod;
  const periodStartStr = toLocalDateString(periodStart);
  const periodEndStr = toLocalDateString(periodEnd);

  // Calculate due_date based on invoice type
  let dueDateObj: Date;
  if (isFirstInvoice) {
    dueDateObj = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
  } else {
    dueDateObj = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 10);
  }
  const dueDateStr = toLocalDateString(dueDateObj);

  // Check for existing invoice for this student/period (temporarily without registration_id)
  const { data: existingInvoice, error: existingError } = await supabase
// ... (rest of the code remains the same)
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .eq('period_start', periodStartStr)
    .eq('period_end', periodEndStr)
    .maybeSingle();
  
  if (existingError) {
    console.error('Error checking for existing invoice:', existingError);
    throw existingError;
  }
  
  if (existingInvoice) {
    console.log('Existing invoice found:', existingInvoice);
    return { existing: existingInvoice }; // Already exists, return existing
  }

  // --- Makeup Credits Enforcement Logic ---
  // 1. Find the previous invoice for this student (by period_end < current period_start)
  const { data: prevInvoice, error: prevInvError } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .lt('period_end', periodStartStr)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (prevInvError) {
    console.error('Error checking for previous invoice:', prevInvError);
    throw prevInvError;
  }

  let creditsApplied = 0;
  let creditsValue = 0;
  let makeupCreditIds: string[] = [];
  let notes = null;
  console.log('🔍 Fee found for invoice generation:', {
    feeId: fee.id,
    feePrice: fee.price,
    feeCurrency: fee.currency,
    feePaymentType: fee.payment_type,
    feeMode: fee.mode,
    feeCourseType: fee.course_type,
    feeCourseName: fee.course_name
  });

  const isTermlyFee = fee.payment_type === 'term';

  // Monthly/per-class use registration preference; termly uses program schedule from fee row
  const sessionsPerWeek = isTermlyFee
    ? (fee.sessions_per_week || 3)
    : (registration.sessions_per_week ? parseInt(String(registration.sessions_per_week), 10) : 1);

  let invoiceAmount = 0;

  if (isTermlyFee) {
    // Termly courses: one flat fee per term (not prorated by registration sessions_per_week)
    invoiceAmount = fee.price;
    console.log('Termly billing (flat term fee):', {
      courseName: fee.course_name,
      termPrice: fee.price,
      programSessionsPerWeek: fee.sessions_per_week,
    });
  } else if (isLanguagesCategory(registration.course_category) && fee.payment_type === 'monthly') {
    invoiceAmount = fee.price;
    console.log('Language monthly billing (flat month):', {
      courseName: fee.course_name,
      monthlyPrice: fee.price,
      sessionsPerWeek: registration.sessions_per_week,
    });
  } else if (fee.payment_type === 'per_class') {
    const numWeeks = 4;
    invoiceAmount = fee.price * sessionsPerWeek * numWeeks;
    console.log('Per-class billing calculation:', {
      pricePerClass: fee.price,
      sessionsPerWeek,
      numWeeks,
      totalAmount: invoiceAmount,
    });
  } else if (fee && fee.sessions_per_week) {
    if (fee.sessions_per_week === 1) {
      invoiceAmount = fee.price * sessionsPerWeek;
    } else if (fee.sessions_per_week === sessionsPerWeek) {
      invoiceAmount = fee.price;
    } else {
      invoiceAmount = (fee.price / fee.sessions_per_week) * sessionsPerWeek;
    }
  } else {
    invoiceAmount = fee.price * sessionsPerWeek;
  }
  
  if (!fee.price || fee.price <= 0) {
    console.error('❌ Fee has invalid price:', fee.price);
    throw new Error(`Fee has invalid price: ${fee.price}`);
  }

  // Only apply credits if previous invoice is paid (or if this is the first invoice)
  let canApplyCredits = false;
  if (!prevInvoice) {
    canApplyCredits = true; // First invoice, allow credits (if you want to, or set to false to never apply on first)
  } else if (prevInvoice.status === 'paid') {
    canApplyCredits = true;
  }

  if (canApplyCredits && !isTermlyFee) {
    // Fetch unused, unexpired makeup credits for this student
    const { data: credits, error: creditsError } = await supabase
      .from('makeup_credits')
      .select('*')
      .eq('student_id', student.id)
      .eq('is_used', false)
      .gte('expires_at', periodStartStr);
    if (creditsError) throw creditsError;
    if (credits && credits.length > 0) {
      const sessionValue = Math.round((fee.price / sessionsPerWeek) * 100) / 100;
      creditsApplied = credits.length;
      creditsValue = Math.min(creditsApplied * sessionValue, invoiceAmount);
      invoiceAmount = Math.max(0, invoiceAmount - creditsValue);
      makeupCreditIds = credits.slice(0, Math.floor(creditsValue / sessionValue)).map(c => c.id);
      notes = `Applied ${makeupCreditIds.length} makeup credit(s) worth KES ${creditsValue.toLocaleString()} to this invoice.`;
    }
  }

  let numWeeks: number;
  let quantity: number;
  let unitPrice: number;
  let lineDescription: string;

  const courseDisplayName = (() => {
    if (registration.course_category === 'Art') return 'Art Classes';
    if (registration.course_category === 'Production') {
      return registration.production_type || 'Production';
    }
    if (registration.course_category === 'Photography') {
      return 'Photography & Videography';
    }
    if (registration.course_category === 'Technology') {
      return registration.technology_type || 'Technology';
    }
    if (isLanguagesCategory(registration.course_category)) {
      return `${getLanguageDisplayName(registration.language_type)} Language Lessons`;
    }
    return registration.instrument || 'Music Lessons';
  })();

  if (isTermlyFee) {
    quantity = 1;
    unitPrice = invoiceAmount;
    const termLabel = getTermDisplayLabel(registration.term_period, fee.duration);
    lineDescription = `${courseDisplayName} - ${termLabel} (term fee — ${getTermScheduleNote(fee)})`;
  } else {
    if (isLanguagesCategory(registration.course_category) && fee.payment_type === 'monthly') {
      quantity = 1;
      unitPrice = invoiceAmount;
      lineDescription = buildLanguageInvoiceLineDescription(courseDisplayName, registration);
    } else {
      if (fee.payment_type === 'monthly' || fee.payment_type === 'per_class') {
        numWeeks = 4;
      } else {
        const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        numWeeks = Math.ceil(daysDiff / 7);
      }
      quantity = sessionsPerWeek * numWeeks;
      if (fee.payment_type === 'per_class') {
        unitPrice = fee.price;
      } else {
        unitPrice = Math.round((invoiceAmount / quantity) * 100) / 100;
      }
      if (fee.payment_type === 'monthly' && courseCategoryLower === 'music') {
        lineDescription = courseDisplayName;
      } else {
        lineDescription = `${courseDisplayName} - ${sessionsPerWeek} session${sessionsPerWeek > 1 ? 's' : ''} per week × ${numWeeks} weeks`;
      }
    }
  }
  
  // Apply partial month billing logic for subsequent invoices (only for monthly payment type, not Technology)
  if (!isTermlyFee && !isFirstInvoice && fee.payment_type === 'monthly' && courseCategoryLower !== 'technology' && courseCategoryLower !== 'languages') {
    // For subsequent invoices, check if student enrolled mid-month in the first month
    const registrationDate = new Date(registration.created_at);
    const firstMonthStart = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 1);
    
    // If student enrolled after the 1st of their enrollment month, calculate partial billing
    if (registrationDate.getDate() > 1) {
      const daysBeforeEnrollment = registrationDate.getDate() - 1;
      const sessionsBeforeEnrollment = Math.ceil((daysBeforeEnrollment / 7) * sessionsPerWeek);
      const deductionAmount = sessionsBeforeEnrollment * unitPrice;
      
      // Deduct the amount for sessions before enrollment
      invoiceAmount = Math.max(0, invoiceAmount - deductionAmount);
      
      // Update notes to reflect the deduction
      if (notes) {
        notes += ` Deducted KES ${deductionAmount.toLocaleString()} for ${sessionsBeforeEnrollment} sessions before enrollment date.`;
      } else {
        notes = `Deducted KES ${deductionAmount.toLocaleString()} for ${sessionsBeforeEnrollment} sessions before enrollment date.`;
      }
      
      console.log('📊 Partial month billing applied:', {
        enrollmentDate: registrationDate.toISOString().slice(0, 10),
        daysBeforeEnrollment,
        sessionsBeforeEnrollment,
        deductionAmount,
        adjustedInvoiceAmount: invoiceAmount
      });
    }
  }
  
  // For Technology courses (per_class), first invoice is always: per_class price × sessions_per_week × 4 weeks
  // No partial month logic applies to Technology courses

  // Add application fee for first invoice only
  const applicationFee = isFirstInvoice ? 800 : 0;
  const totalAmount = invoiceAmount + applicationFee;

  const lineItemAmount = quantity * unitPrice;

  const lineItemsArray = [
    {
      description: lineDescription,
      quantity,
      unitPrice,
      amount: lineItemAmount,
      lessonIds: [],
    },
    ...(isFirstInvoice ? [{
      description: 'Application Fee (One-time, non-refundable enrollment fee)',
      quantity: 1,
      unitPrice: applicationFee,
      amount: applicationFee,
      lessonIds: [],
    }] : [])
  ];
  
  // Calculate subtotal and total from actual line items
  const calculatedSubtotal = lineItemsArray.reduce((sum, item) => sum + item.amount, 0);
  const calculatedTotal = calculatedSubtotal; // No tax
  
  const invoiceDetails = {
    lineItems: lineItemsArray,
    subtotal: calculatedSubtotal, // Use sum of line item amounts
    tax: 0, // Remove tax as requested
    total: calculatedTotal, // Use sum of line item amounts
    paymentTerms: 'Payment due within 7 days of invoice date',
    validUntil: '',
    serviceBreakdown: `${courseDisplayName} as scheduled`,
    equipmentBreakdown: 'All necessary equipment and materials provided',
    additionalInfo: notes || 'Please contact us if you have any questions about this invoice.'
  };

  // Prepare invoice data (using current schema with student_id only)
  const invoiceData: any = {
    student_id: student.id,
    amount_due: totalAmount, // Use total amount including application fee
    period_start: periodStartStr,
    period_end: periodEndStr,
    due_date: dueDateStr,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sessions_per_week: isTermlyFee ? (fee.sessions_per_week || 3) : sessionsPerWeek,
    lessons_summary: invoiceDetails, // Store the detailed breakdown
  };
  
  // Add optional fields if they exist in the schema
  if (fee.id) {
    invoiceData.fee_id = fee.id;
  }
  invoiceData.is_auto_generated = true;
  invoiceData.admin_override = false;
  invoiceData.notes = notes;

  console.log('Creating invoice with data:', invoiceData);

  // Insert invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert([invoiceData])
    .select('*')
    .single();
  
  if (invError) {
    console.error('Error creating invoice:', invError);
    throw invError;
  }

  console.log('Invoice created successfully:', invoice);

  try {
    const pdfUrl = await ensureInvoicePDF(invoice as Record<string, unknown>, student as Record<string, unknown>);
    (invoice as Invoice & { pdf_url?: string }).pdf_url = pdfUrl;
  } catch (pdfError) {
    console.warn('Invoice saved but PDF generation failed (can retry from admin):', pdfError);
  }

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
      if (isInvoiceNotDue(result)) {
        summary.skipped++;
        continue;
      }
      if (result && 'existing' in result) {
        const invoice = result.existing;
        // Defensive check for student_id before fetching student
        if (!isValidId(reg.student_id)) {
          console.error('Registration missing valid student_id for email:', reg);
          summary.errors++;
          continue;
        }
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError && invoice.status !== 'paid') {
          await sendInvoiceEmail(invoice, student, { isReminder: true, isFirstInvoice: false });
          summary.reminders++;
        } else {
          summary.skipped++;
        }
      } else if (result) {
        const invoice = result as Invoice;
        // Defensive check for student_id before fetching student
        if (!isValidId(reg.student_id)) {
          console.error('Registration missing valid student_id for email:', reg);
          summary.errors++;
          continue;
        }
        // Fetch student for email
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', reg.student_id)
          .single();
        if (student && !studentError) {
          await sendInvoiceEmail(invoice, student, { isFirstInvoice: false });
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

/**
 * Test function to check current exchange rates
 * This can be used for debugging or to verify rates are working
 */
export async function testExchangeRates(): Promise<void> {
  console.log('🧪 Testing Exchange Rates...');
  
  const currencies = ['USD', 'EUR', 'GBP'];
  
  for (const currency of currencies) {
    try {
      const rate = await getCachedExchangeRate(currency, 'KES');
      console.log(`✅ ${currency} to KES: 1 ${currency} = ${rate} KES`);
    } catch (error) {
      console.error(`❌ Failed to get ${currency} to KES rate:`, error);
    }
  }
  
  // Test some sample conversions
  const testAmounts = [
    { amount: 44, currency: 'USD' },
    { amount: 50, currency: 'EUR' },
    { amount: 30, currency: 'GBP' }
  ];
  
  for (const test of testAmounts) {
    try {
      const rate = await getCachedExchangeRate(test.currency, 'KES');
      const converted = Math.round(test.amount * rate * 100) / 100;
      console.log(`💰 ${test.amount} ${test.currency} = ${converted} KES`);
    } catch (error) {
      console.error(`❌ Failed to convert ${test.amount} ${test.currency}:`, error);
    }
  }
}

/**
 * Get current exchange rate for a specific currency pair
 * @param fromCurrency - Source currency (e.g., 'USD')
 * @param toCurrency - Target currency (e.g., 'KES')
 * @returns Current exchange rate
 */
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  return await getCachedExchangeRate(fromCurrency, toCurrency);
} 