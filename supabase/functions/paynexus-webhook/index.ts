// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  parseInvoiceIdFromReference,
  verifyPaynexusSignature,
} from '../_shared/paynexus.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-paynexus-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const rawBody = await req.text();
  const signature =
    req.headers.get('X-PayNexus-Signature') ||
    req.headers.get('x-paynexus-signature');

  const valid = await verifyPaynexusSignature(rawBody, signature);
  if (!valid) {
    console.error('Invalid PayNexus webhook signature');
    return json({ error: 'Invalid signature' }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Server misconfigured' }, 500);
    }
    const admin = createClient(supabaseUrl, serviceKey);

    const event = String(payload?.event || '');
    const data = payload?.data || {};
    const reference = data.reference as string | undefined;
    const checkoutId = data.checkout_request_id as string | undefined;
    const accountRef = (data.account_reference || data.merchant_reference || '') as string;
    const sessionId = data.session_id as string | undefined;

    let attempt: any = null;
    if (reference || checkoutId) {
      let attemptQuery = admin.from('payment_attempts').select('*');
      if (reference) {
        attemptQuery = attemptQuery.eq('paynexus_reference', reference);
      } else {
        attemptQuery = attemptQuery.eq('checkout_request_id', checkoutId!);
      }
      const { data: found, error: attemptError } = await attemptQuery.maybeSingle();
      if (attemptError) {
        console.error('Attempt lookup error:', attemptError);
        return json({ error: attemptError.message }, 500);
      }
      attempt = found;
    }

    let invoiceId: string | null = attempt?.invoice_id || null;

    if (!invoiceId) {
      const fromRef =
        parseInvoiceIdFromReference(accountRef) ||
        parseInvoiceIdFromReference(reference) ||
        null;

      if (fromRef) {
        invoiceId = fromRef;
      } else if (accountRef || sessionId) {
        let invQuery = admin.from('invoices').select('id, payment_status, status');
        if (accountRef) {
          invQuery = invQuery.eq('payment_link_reference', accountRef);
        } else {
          invQuery = invQuery.eq('payment_link_session_id', sessionId!);
        }
        const { data: inv } = await invQuery.maybeSingle();
        invoiceId = inv?.id || null;
      }
    }

    if (!invoiceId) {
      console.warn('Webhook could not resolve invoice', {
        reference,
        checkoutId,
        accountRef,
        sessionId,
        event,
      });
      return json({ ResultCode: 0, ResultDesc: 'Unknown payment — ignored' });
    }

    if (attempt?.status === 'completed' && attempt.payment_id) {
      return json({ ResultCode: 0, ResultDesc: 'Already processed' });
    }

    const isFailure =
      event === 'payment.failed' ||
      data.status === 'failed' ||
      data.status === 'cancelled' ||
      data.status === 'expired';

    if (isFailure) {
      if (attempt) {
        const mapped =
          data.status === 'cancelled'
            ? 'cancelled'
            : data.status === 'expired'
              ? 'expired'
              : 'failed';
        await admin
          .from('payment_attempts')
          .update({
            status: mapped,
            failure_reason:
              data.failure_reason || data.user_message || data.provider_reference || mapped,
            raw_webhook: payload,
          })
          .eq('id', attempt.id);
      }
      return json({ ResultCode: 0, ResultDesc: 'Failure recorded' });
    }

    if (event !== 'payment.completed' && data.status !== 'completed') {
      if (attempt) {
        await admin
          .from('payment_attempts')
          .update({
            status: data.status === 'processing' ? 'processing' : attempt.status,
            raw_webhook: payload,
          })
          .eq('id', attempt.id);
      }
      return json({ ResultCode: 0, ResultDesc: 'Status updated' });
    }

    const mpesaTx =
      data.transaction_id ||
      data.provider_transaction_id ||
      data.mpesa_receipt ||
      null;
    const paidAmount = Number(data.amount ?? attempt?.amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      if (attempt) {
        await admin
          .from('payment_attempts')
          .update({
            status: 'failed',
            failure_reason: 'Invalid amount in webhook',
            raw_webhook: payload,
          })
          .eq('id', attempt.id);
      }
      return json({ error: 'Invalid amount' }, 400);
    }

    const { data: ledgerResult, error: ledgerError } = await admin.rpc(
      'record_gateway_invoice_payment',
      {
        p_invoice_id: invoiceId,
        p_cash_amount: Math.round(paidAmount),
        p_payment_method: 'mpesa',
        p_mpesa_transaction_id: mpesaTx,
        p_payer_phone: data.phone || attempt?.phone || null,
        p_paid_date: new Date().toISOString().slice(0, 10),
        p_notes: `PayNexus ${reference || accountRef || checkoutId || 'payment'}`,
        p_raw_callback_data: payload,
      },
    );

    if (ledgerError) {
      console.error('record_gateway_invoice_payment failed:', ledgerError);
      if (attempt) {
        await admin
          .from('payment_attempts')
          .update({
            status: 'failed',
            failure_reason: ledgerError.message,
            raw_webhook: payload,
          })
          .eq('id', attempt.id);
      }
      return json({ error: ledgerError.message }, 500);
    }

    if (attempt) {
      await admin
        .from('payment_attempts')
        .update({
          status: 'completed',
          mpesa_transaction_id: mpesaTx,
          payment_id: ledgerResult?.payment_id ?? null,
          raw_webhook: payload,
          completed_at: new Date().toISOString(),
          failure_reason: null,
        })
        .eq('id', attempt.id);
    }

    try {
      const { data: invoice } = await admin
        .from('invoices')
        .select(
          'id, period_start, period_end, amount_due, amount_paid, payment_status, students(student_name, email)',
        )
        .eq('id', invoiceId)
        .maybeSingle();

      const student = (invoice as any)?.students;
      if (student?.email) {
        const period = formatPeriod(invoice?.period_end || invoice?.period_start);
        const becamePaid = Boolean(ledgerResult?.became_paid);
        await admin.functions.invoke('send-confirmation-email', {
          body: {
            to: student.email,
            subject: becamePaid
              ? 'Payment received — Damon Music Academy'
              : 'Partial payment received — Damon Music Academy',
            html: `<!DOCTYPE html><html><body>
              <p>Dear ${student.student_name || 'Student'},</p>
              <p>We received your M-Pesa payment of <strong>KES ${Math.round(paidAmount).toLocaleString()}</strong>${
                period ? ` for <strong>${period}</strong>` : ''
              }.</p>
              <p>M-Pesa receipt: <strong>${mpesaTx || '—'}</strong></p>
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

    return json({ ResultCode: 0, ResultDesc: 'Received' });
  } catch (error) {
    console.error('paynexus-webhook error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});

function formatPeriod(dateStr?: string | null) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  if (!y || !m) return '';
  return new Date(y, m - 1, d || 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
