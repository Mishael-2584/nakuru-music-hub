// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { initiateStkPush, normalizeKenyaPhone } from '../_shared/paynexus.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: 'Server misconfigured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoice_id as string | undefined;
    const phoneRaw = body.phone as string | undefined;
    const amountRaw = body.amount;

    if (!invoiceId || !phoneRaw) {
      return json({ error: 'invoice_id and phone are required' }, 400);
    }

    const phone = normalizeKenyaPhone(phoneRaw);
    if (!/^0[17]\d{8}$/.test(phone) && !/^254[17]\d{8}$/.test(phone.replace(/\D/g, ''))) {
      // Soft check — PayNexus also normalizes; reject obviously bad input
      if (phone.replace(/\D/g, '').length < 9) {
        return json({ error: 'Enter a valid M-Pesa phone number (e.g. 07XXXXXXXX)' }, 400);
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    const { data: invoice, error: invoiceError } = await admin
      .from('invoices')
      .select('id, student_id, status, payment_status, amount_due, amount_paid, period_start, period_end, manual_amount_due, manual_amount_override')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return json({ error: 'Invoice not found' }, 404);
    }

    if (invoice.status === 'cancelled') {
      return json({ error: 'This invoice has been cancelled' }, 400);
    }

    if (!isAdmin) {
      const { data: ownStudent } = await admin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!ownStudent || invoice.student_id !== ownStudent.id) {
        return json({ error: 'You can only pay your own invoices' }, 403);
      }
    }

    const studentId = invoice.student_id as string;

    const { data: studentRow } = await admin
      .from('students')
      .select('id, student_name, phone')
      .eq('id', studentId)
      .single();

    const { data: effectiveDue, error: dueError } = await admin.rpc('get_invoice_effective_due', {
      p_invoice_id: invoiceId,
    });
    if (dueError) {
      return json({ error: dueError.message }, 500);
    }

    const due = Number(effectiveDue) || 0;
    const paid = Number(invoice.amount_paid) || 0;
    const balance = Math.max(0, Math.round((due - paid) * 100) / 100);

    if (balance <= 0 || invoice.payment_status === 'paid') {
      return json({ error: 'This invoice is already fully paid' }, 400);
    }

    let amount = amountRaw != null ? Number(amountRaw) : balance;
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Amount must be greater than zero' }, 400);
    }
    amount = Math.round(amount);
    if (amount < 1) {
      return json({ error: 'Amount must be at least 1 KES' }, 400);
    }
    if (amount > balance) {
      return json({ error: `Amount cannot exceed remaining balance of ${balance} KES` }, 400);
    }

    // Expire older open attempts for this invoice (keep history)
    await admin
      .from('payment_attempts')
      .update({ status: 'expired', failure_reason: 'Superseded by a new STK request' })
      .eq('invoice_id', invoiceId)
      .in('status', ['initiated', 'processing']);

    const periodLabel = formatPeriod(invoice.period_end || invoice.period_start);
    const description = `DMA invoice ${periodLabel || invoiceId.slice(0, 8)} · ${studentRow?.student_name || 'Student'}`.slice(0, 100);

    const { data: attempt, error: attemptError } = await admin
      .from('payment_attempts')
      .insert({
        invoice_id: invoiceId,
        student_id: studentId,
        amount,
        phone,
        description,
        status: 'initiated',
        initiated_by: user.id,
      })
      .select('id')
      .single();

    if (attemptError || !attempt) {
      return json({ error: attemptError?.message || 'Could not create payment attempt' }, 500);
    }

    let stk;
    try {
      stk = await initiateStkPush({ amount, phone, description });
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
      amount: stk.data.amount ?? amount,
      phone: stk.data.phone || phone,
      status: stk.data.status || 'initiated',
      message: 'Check your phone and enter your M-Pesa PIN to complete payment.',
    });
  } catch (error) {
    console.error('initiate-mpesa-payment error:', error);
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
