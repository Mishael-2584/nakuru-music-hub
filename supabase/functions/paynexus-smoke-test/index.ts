// One-shot connectivity / status helper for PayNexus.
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getPaymentByReference, initiateStkPush, normalizeKenyaPhone } from '../_shared/paynexus.ts';

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
