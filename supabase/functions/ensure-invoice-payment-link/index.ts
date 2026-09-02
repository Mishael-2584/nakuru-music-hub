// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildAcademyPayUrl } from '../_shared/payLink.ts';
import { invoicePaymentReference } from '../_shared/paynexus.ts';

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
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoice_id as string | undefined;
    const forceNew = Boolean(body.force_new);
    if (!invoiceId) return json({ error: 'invoice_id is required' }, 400);

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    const { data: invoice, error: invoiceError } = await admin
      .from('invoices')
      .select(
        'id, student_id, status, payment_status, amount_paid, period_start, period_end, payment_link_url, payment_link_session_id, payment_link_reference, payment_link_amount, payment_link_expires_at',
      )
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) return json({ error: 'Invoice not found' }, 404);
    if (invoice.status === 'cancelled') {
      return json({ error: 'Cannot create a payment link for a cancelled invoice' }, 400);
    }

    if (!isAdmin) {
      const { data: student } = await admin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!student || student.id !== invoice.student_id) {
        return json({ error: 'Not allowed' }, 403);
      }
    }

    const { data: effectiveDue, error: dueError } = await admin.rpc('get_invoice_effective_due', {
      p_invoice_id: invoiceId,
    });
    if (dueError) return json({ error: dueError.message }, 500);

    const due = Number(effectiveDue) || 0;
    const paid = Number(invoice.amount_paid) || 0;
    const balance = Math.max(0, Math.round(due - paid));

    if (balance < 1 || invoice.payment_status === 'paid') {
      return json({ error: 'Invoice is already fully paid', balance: 0 }, 400);
    }

    const expiresAt = invoice.payment_link_expires_at
      ? new Date(invoice.payment_link_expires_at).getTime()
      : 0;
    const isAcademyPayLink = String(invoice.payment_link_url || '').includes('/pay?');
    const stillValid =
      !forceNew &&
      isAcademyPayLink &&
      invoice.payment_link_url &&
      Number(invoice.payment_link_amount) === balance &&
      expiresAt > Date.now() + 60_000;

    if (stillValid) {
      return json({
        success: true,
        reused: true,
        payment_link_url: invoice.payment_link_url,
        payment_link_session_id: invoice.payment_link_session_id,
        payment_link_reference: invoice.payment_link_reference,
        payment_link_expires_at: invoice.payment_link_expires_at,
        amount: balance,
      });
    }

    const { data: studentRow } = await admin
      .from('students')
      .select('student_name')
      .eq('id', invoice.student_id)
      .maybeSingle();

    const periodLabel = formatPeriod(invoice.period_end || invoice.period_start);
    const reference = invoicePaymentReference(invoiceId);
    const description =
      `${reference} · DMA ${periodLabel || 'invoice'} · ${studentRow?.student_name || 'Student'}`.slice(
        0,
        100,
      );

    // PayNexus hosted /checkout/s/{session} currently returns HTTP 500.
    // Email Pay Now uses our academy /pay page + working STK Push instead.
    const academyPay = await buildAcademyPayUrl({
      invoiceId,
      amount: balance,
      ttlSeconds: 7 * 24 * 60 * 60,
    });

    const { error: updateError } = await admin
      .from('invoices')
      .update({
        payment_link_url: academyPay.url,
        payment_link_session_id: `paylink_${academyPay.expUnix}`,
        payment_link_reference: reference,
        payment_link_amount: balance,
        payment_link_expires_at: academyPay.expiresAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      return json({ error: updateError.message, checkout_url: academyPay.url }, 500);
    }

    await admin
      .from('payment_attempts')
      .update({
        status: 'expired',
        failure_reason: 'Superseded by a new payment link',
      })
      .eq('invoice_id', invoiceId)
      .in('status', ['initiated', 'processing'])
      .eq('phone', 'email-checkout');

    await admin.from('payment_attempts').insert({
      invoice_id: invoiceId,
      student_id: invoice.student_id,
      amount: balance,
      phone: 'email-checkout',
      description,
      status: 'initiated',
      checkout_request_id: `paylink_${academyPay.expUnix}`,
      paynexus_reference: null,
      initiated_by: user.id,
      raw_response: {
        mode: 'academy_pay_page',
        url: academyPay.url,
        note: 'PayNexus hosted checkout page returns 500; using academy /pay + STK',
      },
    });

    return json({
      success: true,
      reused: false,
      payment_link_url: academyPay.url,
      payment_link_session_id: `paylink_${academyPay.expUnix}`,
      payment_link_reference: reference,
      payment_link_expires_at: academyPay.expiresAtIso,
      amount: balance,
      mode: 'academy_stk',
    });
  } catch (error) {
    console.error('ensure-invoice-payment-link:', error);
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
