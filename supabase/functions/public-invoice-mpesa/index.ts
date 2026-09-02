// Public email pay flow: verify signed link → invoice info / STK initiate (no user JWT).
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { initiateStkPush, normalizeKenyaPhone, getPaymentByReference } from '../_shared/paynexus.ts';
import { verifyPayLink } from '../_shared/payLink.ts';
import {
  applyCompletedPaynexusPayment,
  extractMpesaTx,
} from '../_shared/applyPaynexusPayment.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500);
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'info');
    const invoiceId = body.invoice_id as string | undefined;
    const amount = Math.round(Number(body.amount));
    const exp = Number(body.exp);
    const sig = String(body.sig || '');

    if (!invoiceId || !Number.isFinite(amount) || !Number.isFinite(exp) || !sig) {
      return json({ error: 'invoice_id, amount, exp, and sig are required' }, 400);
    }

    const verified = await verifyPayLink({
      invoiceId,
      amount,
      expUnix: exp,
      signature: sig,
    });
    if (!verified.ok) return json({ error: verified.error || 'Invalid link' }, 401);

    const { data: invoice, error: invoiceError } = await admin
      .from('invoices')
      .select(
        'id, student_id, status, payment_status, amount_due, amount_paid, period_start, period_end, manual_amount_due, manual_amount_override',
      )
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) return json({ error: 'Invoice not found' }, 404);
    if (invoice.status === 'cancelled') {
      return json({ error: 'This invoice has been cancelled' }, 400);
    }

    const { data: effectiveDue, error: dueError } = await admin.rpc('get_invoice_effective_due', {
      p_invoice_id: invoiceId,
    });
    if (dueError) return json({ error: dueError.message }, 500);

    const due = Number(effectiveDue) || 0;
    const paid = Number(invoice.amount_paid) || 0;
    const balance = Math.max(0, Math.round(due - paid));

    const { data: student } = await admin
      .from('students')
      .select('id, student_name, phone, email')
      .eq('id', invoice.student_id)
      .maybeSingle();

    const periodLabel = formatPeriod(invoice.period_end || invoice.period_start);

    if (action === 'info') {
      return json({
        success: true,
        invoice_id: invoice.id,
        student_name: student?.student_name || 'Student',
        phone_hint: student?.phone || '',
        period_label: periodLabel,
        amount_due: due,
        amount_paid: paid,
        balance,
        link_amount: amount,
        payable_amount: Math.min(amount, balance),
        payment_status: invoice.payment_status,
        already_paid: balance < 1 || invoice.payment_status === 'paid',
      });
    }

    if (action === 'reconcile') {
      const attemptId = body.attempt_id as string | undefined;
      if (!attemptId) return json({ error: 'attempt_id is required' }, 400);

      const { data: attempt } = await admin
        .from('payment_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('invoice_id', invoiceId)
        .maybeSingle();

      if (!attempt) return json({ error: 'Payment attempt not found' }, 404);

      if (attempt.status === 'completed' && attempt.payment_id) {
        return json({
          success: true,
          status: 'completed',
          already_applied: true,
          attempt_id: attempt.id,
          payment_id: attempt.payment_id,
          mpesa_transaction_id: attempt.mpesa_transaction_id,
        });
      }

      if (!attempt.paynexus_reference) {
        return json({
          success: true,
          status: attempt.status || 'initiated',
          pending: true,
          attempt_id: attempt.id,
        });
      }

      const statusRaw = (await getPaymentByReference(attempt.paynexus_reference)) as any;
      const data = statusRaw?.data || statusRaw;
      const status = String(data?.status || '').toLowerCase();

      if (status === 'completed' || status === 'successful' || status === 'success') {
        const applied = await applyCompletedPaynexusPayment(admin, {
          invoiceId,
          amount: Number(data?.amount ?? attempt.amount),
          mpesaTx: extractMpesaTx(data),
          phone: data?.phone || attempt.phone,
          reference: attempt.paynexus_reference,
          payload: { source: 'public-reconcile', statusRaw },
          attemptId: attempt.id,
        });
        if (!applied.ok) return json({ error: applied.error || 'Failed to apply payment' }, 500);
        return json({
          success: true,
          status: 'completed',
          attempt_id: attempt.id,
          payment_id: applied.ledgerResult?.payment_id,
          mpesa_transaction_id: extractMpesaTx(data),
          balance_remaining: applied.ledgerResult?.balance_remaining,
        });
      }

      if (['failed', 'cancelled', 'canceled', 'expired'].includes(status)) {
        const mapped = status === 'canceled' ? 'cancelled' : status;
        await admin
          .from('payment_attempts')
          .update({
            status: mapped,
            failure_reason: data?.failure_reason || data?.provider_reference || mapped,
            raw_response: statusRaw,
          })
          .eq('id', attempt.id);
        return json({
          success: true,
          status: mapped,
          attempt_id: attempt.id,
          failure_reason: data?.failure_reason || mapped,
        });
      }

      return json({
        success: true,
        status: status || attempt.status || 'initiated',
        pending: true,
        attempt_id: attempt.id,
      });
    }

    if (action !== 'initiate') {
      return json({ error: 'Unknown action' }, 400);
    }

    if (balance < 1 || invoice.payment_status === 'paid') {
      return json({ error: 'This invoice is already fully paid' }, 400);
    }

    // Signed amount is authoritative for the email link; never exceed current balance.
    const payAmount = Math.min(amount, balance);
    if (payAmount < 1) return json({ error: 'Nothing left to pay on this invoice' }, 400);

    const phone = normalizeKenyaPhone(String(body.phone || ''));
    if (phone.replace(/\D/g, '').length < 9) {
      return json({ error: 'Enter a valid M-Pesa phone number (e.g. 07XXXXXXXX)' }, 400);
    }

    await admin
      .from('payment_attempts')
      .update({ status: 'expired', failure_reason: 'Superseded by a new email STK request' })
      .eq('invoice_id', invoiceId)
      .in('status', ['initiated', 'processing']);

    const description =
      `dma-invoice:${invoiceId} · DMA ${periodLabel || 'invoice'} · ${student?.student_name || 'Student'}`.slice(
        0,
        100,
      );

    const { data: attempt, error: attemptError } = await admin
      .from('payment_attempts')
      .insert({
        invoice_id: invoiceId,
        student_id: invoice.student_id,
        amount: payAmount,
        phone,
        description,
        status: 'initiated',
        initiated_by: null,
      })
      .select('id')
      .single();

    if (attemptError || !attempt) {
      return json({ error: attemptError?.message || 'Could not create payment attempt' }, 500);
    }

    let stk;
    try {
      stk = await initiateStkPush({ amount: payAmount, phone, description });
    } catch (e) {
      await admin
        .from('payment_attempts')
        .update({
          status: 'failed',
          failure_reason: e instanceof Error ? e.message : 'STK initiate failed',
        })
        .eq('id', attempt.id);
      return json({ error: e instanceof Error ? e.message : 'STK initiate failed' }, 502);
    }

    if (!stk.success || !stk.data?.reference) {
      const reason = stk.error || 'Failed to initiate M-Pesa STK Push';
      await admin
        .from('payment_attempts')
        .update({
          status: 'failed',
          failure_reason: reason,
          raw_response: stk.raw ?? null,
        })
        .eq('id', attempt.id);
      return json({ error: reason, attempt_id: attempt.id }, 502);
    }

    await admin
      .from('payment_attempts')
      .update({
        status: stk.data.status === 'processing' ? 'processing' : 'initiated',
        paynexus_reference: stk.data.reference,
        checkout_request_id: stk.data.checkout_request_id,
        phone: stk.data.phone || phone,
        raw_response: stk.raw ?? null,
      })
      .eq('id', attempt.id);

    return json({
      success: true,
      attempt_id: attempt.id,
      reference: stk.data.reference,
      checkout_request_id: stk.data.checkout_request_id,
      amount: stk.data.amount ?? payAmount,
      phone: stk.data.phone || phone,
      status: stk.data.status || 'initiated',
      message: 'Check your phone and enter your M-Pesa PIN to complete payment.',
    });
  } catch (error) {
    console.error('public-invoice-mpesa:', error);
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
    month: 'short',
    year: 'numeric',
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
