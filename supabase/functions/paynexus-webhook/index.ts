// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  parseInvoiceIdFromReference,
  verifyPaynexusSignature,
} from '../_shared/paynexus.ts';
import {
  applyCompletedPaynexusPayment,
  extractMpesaTx,
} from '../_shared/applyPaynexusPayment.ts';

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

  const signatureValid = await verifyPaynexusSignature(rawBody, signature);

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

    // If signature is bad, only continue when we already have a pending attempt we know about.
    if (!signatureValid) {
      const pending =
        attempt && ['initiated', 'processing'].includes(String(attempt.status));
      if (!pending) {
        console.error('Invalid PayNexus webhook signature (and no pending attempt match)');
        return json({ error: 'Invalid signature' }, 401);
      }
      console.warn(
        'PayNexus webhook signature mismatch — processing because pending attempt matched',
        { reference, attemptId: attempt.id },
      );
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

    const mpesaTx = extractMpesaTx(data);
    const paidAmount = Number(data.amount ?? attempt?.amount);
    const applied = await applyCompletedPaynexusPayment(admin, {
      invoiceId,
      amount: paidAmount,
      mpesaTx,
      phone: data.phone || attempt?.phone,
      reference: reference || accountRef || checkoutId,
      payload,
      attemptId: attempt?.id || null,
    });

    if (!applied.ok) {
      console.error('applyCompletedPaynexusPayment failed:', applied.error);
      if (attempt) {
        await admin
          .from('payment_attempts')
          .update({
            status: 'failed',
            failure_reason: applied.error,
            raw_webhook: payload,
          })
          .eq('id', attempt.id);
      }
      return json({ error: applied.error }, 500);
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
