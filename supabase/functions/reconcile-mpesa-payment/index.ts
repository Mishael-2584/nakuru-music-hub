// Reconcile a payment_attempt against PayNexus status API (webhook fallback).
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPaymentByReference } from '../_shared/paynexus.ts';
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
    const attemptId = body.attempt_id as string | undefined;
    const reference = body.reference as string | undefined;

    if (!attemptId && !reference) {
      return json({ error: 'attempt_id or reference is required' }, 400);
    }

    let attemptQuery = admin.from('payment_attempts').select('*');
    if (attemptId) attemptQuery = attemptQuery.eq('id', attemptId);
    else attemptQuery = attemptQuery.eq('paynexus_reference', reference!);

    const { data: attempt, error: attemptError } = await attemptQuery.maybeSingle();
    if (attemptError) return json({ error: attemptError.message }, 500);
    if (!attempt) return json({ error: 'Payment attempt not found' }, 404);

    // Authz: admin or owning student
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
    if (!isAdmin) {
      const { data: student } = await admin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!student || student.id !== attempt.student_id) {
        return json({ error: 'Not allowed' }, 403);
      }
    }

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

    const paynexusRef = attempt.paynexus_reference;
    if (!paynexusRef) {
      return json({ error: 'Attempt has no PayNexus reference yet' }, 400);
    }

    const statusRaw = (await getPaymentByReference(paynexusRef)) as any;
    const data = statusRaw?.data || statusRaw;
    const status = String(data?.status || '').toLowerCase();

    if (status === 'completed' || status === 'successful' || status === 'success') {
      const mpesaTx = extractMpesaTx(data);
      const amount = Number(data?.amount ?? attempt.amount);
      const applied = await applyCompletedPaynexusPayment(admin, {
        invoiceId: attempt.invoice_id,
        amount,
        mpesaTx,
        phone: data?.phone || attempt.phone,
        reference: paynexusRef,
        payload: { source: 'reconcile', statusRaw },
        attemptId: attempt.id,
      });

      if (!applied.ok) {
        return json({ error: applied.error || 'Failed to apply payment' }, 500);
      }

      return json({
        success: true,
        status: 'completed',
        already_applied: Boolean(applied.ledgerResult?.duplicate),
        attempt_id: attempt.id,
        payment_id: applied.ledgerResult?.payment_id,
        mpesa_transaction_id: mpesaTx,
        balance_remaining: applied.ledgerResult?.balance_remaining,
        payment_status: applied.ledgerResult?.payment_status,
      });
    }

    if (['failed', 'cancelled', 'canceled', 'expired'].includes(status)) {
      await admin
        .from('payment_attempts')
        .update({
          status: status === 'canceled' ? 'cancelled' : status,
          failure_reason: data?.failure_reason || data?.provider_reference || status,
          raw_response: statusRaw,
        })
        .eq('id', attempt.id);

      return json({
        success: true,
        status: status === 'canceled' ? 'cancelled' : status,
        attempt_id: attempt.id,
        failure_reason: data?.failure_reason || status,
      });
    }

    // Still pending — touch updated_at via no-op status keep
    return json({
      success: true,
      status: status || attempt.status || 'initiated',
      attempt_id: attempt.id,
      pending: true,
    });
  } catch (error) {
    console.error('reconcile-mpesa-payment:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
