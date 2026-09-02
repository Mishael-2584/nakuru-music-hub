// One-shot connectivity / status / backfill helper for PayNexus.
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getPaymentByReference, initiateStkPush, normalizeKenyaPhone } from '../_shared/paynexus.ts';
import {
  applyCompletedPaynexusPayment,
  extractMpesaTx,
} from '../_shared/applyPaynexusPayment.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const gate = req.headers.get('x-smoke-token') || '';
  const expected = Deno.env.get('PAYNEXUS_SMOKE_TOKEN') || 'dma-paynexus-smoke';
  if (gate !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));

    if (body.action === 'status' && body.reference) {
      const status = await getPaymentByReference(String(body.reference));
      return new Response(JSON.stringify({ reference: body.reference, status }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'create-checkout') {
      const { createCheckoutSession, invoicePaymentReference } = await import('../_shared/paynexus.ts');
      const invoiceId = body.invoice_id || '00000000-0000-0000-0000-000000000000';
      const amount = Math.max(1, Math.round(Number(body.amount) || 10));
      const result = await createCheckoutSession({
        amount,
        description: `${invoicePaymentReference(invoiceId)} · DMA email-link smoke test`,
        reference: invoicePaymentReference(invoiceId),
        returnUrl: 'https://damonmusicacademy.co.ke/auth?payment=success',
        cancelUrl: 'https://damonmusicacademy.co.ke/auth?payment=cancelled',
      });
      return new Response(JSON.stringify({ amount, ...result }), {
        status: result.success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'backfill' && body.reference) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceKey) {
        return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const admin = createClient(supabaseUrl, serviceKey);
      const reference = String(body.reference);

      const { data: attempt } = await admin
        .from('payment_attempts')
        .select('*')
        .eq('paynexus_reference', reference)
        .maybeSingle();

      if (!attempt) {
        return new Response(JSON.stringify({ error: 'No payment_attempt for reference' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (attempt.status === 'completed' && attempt.payment_id) {
        return new Response(
          JSON.stringify({ success: true, already_applied: true, attempt }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const statusRaw = (await getPaymentByReference(reference)) as any;
      const data = statusRaw?.data || statusRaw;
      const status = String(data?.status || '').toLowerCase();
      if (status !== 'completed' && status !== 'successful' && status !== 'success') {
        return new Response(
          JSON.stringify({ error: `PayNexus status is ${status || 'unknown'}`, statusRaw }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const applied = await applyCompletedPaynexusPayment(admin, {
        invoiceId: attempt.invoice_id,
        amount: Number(data?.amount ?? attempt.amount),
        mpesaTx: extractMpesaTx(data),
        phone: data?.phone || attempt.phone,
        reference,
        payload: { source: 'smoke-backfill', statusRaw },
        attemptId: attempt.id,
      });

      return new Response(JSON.stringify({ success: applied.ok, ...applied }), {
        status: applied.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone = normalizeKenyaPhone(body.phone || '0794978233');
    const amount = Math.max(1, Math.round(Number(body.amount) || 1));

    const result = await initiateStkPush({
      amount,
      phone,
      description: 'DMA PayNexus smoke test',
    });

    return new Response(JSON.stringify({ phone, amount, ...result }), {
      status: result.success ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
