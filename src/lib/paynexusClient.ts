import { supabase } from '../integrations/supabase/client';

export interface InitiateMpesaPaymentParams {
  invoiceId: string;
  phone: string;
  amount?: number;
  studentId?: string;
}

export interface InitiateMpesaPaymentResult {
  success: boolean;
  attempt_id?: string;
  reference?: string;
  checkout_request_id?: string;
  amount?: number;
  phone?: string;
  status?: string;
  message?: string;
  error?: string;
}

export async function initiateMpesaPayment(
  params: InitiateMpesaPaymentParams,
): Promise<InitiateMpesaPaymentResult> {
  const { data, error } = await supabase.functions.invoke('initiate-mpesa-payment', {
    body: {
      invoice_id: params.invoiceId,
      phone: params.phone,
      amount: params.amount,
      student_id: params.studentId,
    },
  });

  if (error) {
    const msg =
      (data as any)?.error ||
      error.message ||
      'Failed to start M-Pesa payment';
    return { success: false, error: msg };
  }

  if ((data as any)?.error) {
    return { success: false, error: (data as any).error, ...(data as any) };
  }

  return data as InitiateMpesaPaymentResult;
}

export async function ensureInvoicePaymentLink(invoiceId: string, forceNew = false): Promise<{
  success: boolean;
  payment_link_url?: string;
  amount?: number;
  error?: string;
  reused?: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('ensure-invoice-payment-link', {
    body: { invoice_id: invoiceId, force_new: forceNew },
  });

  if (error) {
    return {
      success: false,
      error: (data as any)?.error || error.message || 'Failed to create payment link',
    };
  }
  if ((data as any)?.error) {
    return { success: false, error: (data as any).error };
  }
  return data as {
    success: boolean;
    payment_link_url?: string;
    amount?: number;
    reused?: boolean;
  };
}

export async function fetchPaymentAttempt(attemptId: string) {
  const { data, error } = await supabase
    .from('payment_attempts' as any)
    .select('id, invoice_id, amount, phone, status, failure_reason, paynexus_reference, mpesa_transaction_id, payment_id, created_at, updated_at, completed_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (error) throw error;
  return data as {
    id: string;
    invoice_id: string;
    amount: number;
    phone: string;
    status: string;
    failure_reason?: string | null;
    paynexus_reference?: string | null;
    mpesa_transaction_id?: string | null;
    payment_id?: string | null;
    created_at?: string;
    updated_at?: string;
    completed_at?: string | null;
  } | null;
}
