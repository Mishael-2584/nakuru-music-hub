// Shared: apply a completed PayNexus payment onto an invoice + optional attempt row.
// deno-lint-ignore-file
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function applyCompletedPaynexusPayment(
  admin: SupabaseClient,
  params: {
    invoiceId: string;
    amount: number;
    mpesaTx: string | null;
    phone?: string | null;
    reference?: string | null;
    payload: unknown;
    attemptId?: string | null;
  },
): Promise<{ ok: boolean; ledgerResult?: any; error?: string }> {
  const paidAmount = Math.round(Number(params.amount));
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    return { ok: false, error: 'Invalid amount' };
  }

  const { data: ledgerResult, error: ledgerError } = await admin.rpc(
    'record_gateway_invoice_payment',
    {
      p_invoice_id: params.invoiceId,
      p_cash_amount: paidAmount,
      p_payment_method: 'mpesa',
      p_mpesa_transaction_id: params.mpesaTx,
      p_payer_phone: params.phone || null,
      p_paid_date: new Date().toISOString().slice(0, 10),
      p_notes: `PayNexus ${params.reference || 'payment'}`,
      p_raw_callback_data: params.payload,
    },
  );

  if (ledgerError) {
    return { ok: false, error: ledgerError.message };
  }

  if (params.attemptId) {
    await admin
      .from('payment_attempts')
      .update({
        status: 'completed',
        mpesa_transaction_id: params.mpesaTx,
        payment_id: ledgerResult?.payment_id ?? null,
        raw_webhook: params.payload,
        completed_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq('id', params.attemptId);
  }

  // Best-effort receipt email
  try {
    const { data: invoice } = await admin
      .from('invoices')
      .select(
        'id, period_start, period_end, payment_status, students(student_name, email)',
      )
      .eq('id', params.invoiceId)
      .maybeSingle();

    const student = (invoice as any)?.students;
    if (student?.email && !ledgerResult?.duplicate) {
      const becamePaid = Boolean(ledgerResult?.became_paid);
      await admin.functions.invoke('send-confirmation-email', {
        body: {
          to: student.email,
          subject: becamePaid
            ? 'Payment received — Damon Music Academy'
            : 'Partial payment received — Damon Music Academy',
          html: `<!DOCTYPE html><html><body>
            <p>Dear ${student.student_name || 'Student'},</p>
            <p>We received your M-Pesa payment of <strong>KES ${paidAmount.toLocaleString()}</strong>.</p>
            <p>M-Pesa receipt: <strong>${params.mpesaTx || '—'}</strong></p>
            <p>Invoice status: <strong>${ledgerResult?.payment_status || invoice?.payment_status}</strong>.
            Balance remaining: <strong>KES ${Number(ledgerResult?.balance_remaining ?? 0).toLocaleString()}</strong>.</p>
            <p>Thank you,<br/>Damon Music Academy</p>
          </body></html>`,
        },
      });
    }
  } catch (emailErr) {
    console.warn('Receipt email failed (payment still recorded):', emailErr);
  }

  return { ok: true, ledgerResult };
}

export function extractMpesaTx(data: Record<string, unknown>): string | null {
  return (
    (data.transaction_id as string) ||
    (data.provider_transaction_id as string) ||
    (data.mpesa_receipt as string) ||
    null
  );
}
