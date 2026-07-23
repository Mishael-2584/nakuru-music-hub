const PAYNEXUS_BASE = Deno.env.get('PAYNEXUS_API_BASE') || 'https://paynexus.co.ke/api';

export function getPaynexusSecretKey(): string {
  const key = Deno.env.get('PAYNEXUS_SECRET_KEY');
  if (!key) throw new Error('PAYNEXUS_SECRET_KEY is not configured');
  return key;
}

export function getPaynexusPublicKey(): string {
  const key = Deno.env.get('PAYNEXUS_PUBLIC_KEY') || Deno.env.get('PAYNEXUS_SECRET_KEY');
  if (!key) throw new Error('PAYNEXUS_PUBLIC_KEY is not configured');
  return key;
}

export function getPaynexusWebhookSecret(): string {
  return Deno.env.get('PAYNEXUS_WEBHOOK_SECRET') || '';
}

export async function verifyPaynexusSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const secret = getPaynexusWebhookSecret();
  if (!secret) {
    // Fail closed in production if secret missing after configure; allow empty only when explicitly set to "disabled"
    if (Deno.env.get('PAYNEXUS_WEBHOOK_SECRET_OPTIONAL') === 'true') return true;
    return false;
  }
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time-ish compare
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function initiateStkPush(params: {
  amount: number;
  phone: string;
  description?: string;
}): Promise<{
  success: boolean;
  data?: {
    reference: string;
    checkout_request_id: string;
    amount: number;
    phone: string;
    status: string;
  };
  message?: string;
  error?: string;
  raw?: unknown;
}> {
  const res = await fetch(`${PAYNEXUS_BASE}/mpesa/payment/initiate`, {
    method: 'POST',
    headers: {
      'X-API-Key': getPaynexusSecretKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amount),
      phone: params.phone,
      description: params.description || 'Invoice payment',
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: (raw as any)?.message || (raw as any)?.error || `PayNexus error ${res.status}`,
      raw,
    };
  }

  // Live API nests fields under data; normalize for callers.
  const data = (raw as any)?.data || {};
  return {
    success: Boolean((raw as any)?.success ?? true),
    data: {
      reference: data.reference,
      checkout_request_id: data.checkout_request_id,
      amount: data.amount,
      phone: data.phone,
      status: data.status || (data.response_code === '0' ? 'initiated' : data.status),
    },
    message: (raw as any)?.message,
    raw,
  };
}

export async function getPaymentByReference(reference: string): Promise<unknown> {
  const res = await fetch(`${PAYNEXUS_BASE}/payments/${encodeURIComponent(reference)}`, {
    headers: { 'X-API-Key': getPaynexusPublicKey() },
  });
  return res.json().catch(() => ({}));
}

export async function createCheckoutSession(params: {
  amount: number;
  description?: string;
  reference: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<{
  success: boolean;
  data?: {
    session_id: string;
    checkout_url: string;
    expires_at?: string;
  };
  message?: string;
  error?: string;
  raw?: unknown;
}> {
  const res = await fetch(`${PAYNEXUS_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'X-API-Key': getPaynexusSecretKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amount),
      description: params.description || 'Invoice payment',
      reference: params.reference,
      return_url: params.returnUrl || 'https://damonmusicacademy.co.ke/auth',
      cancel_url: params.cancelUrl || 'https://damonmusicacademy.co.ke/auth',
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: (raw as any)?.message || (raw as any)?.error || `PayNexus error ${res.status}`,
      raw,
    };
  }

  return {
    success: Boolean((raw as any)?.success ?? true),
    data: (raw as any)?.data,
    message: (raw as any)?.message,
    raw,
  };
}

/** Normalize Kenyan mobile numbers toward 07... / 254... forms accepted by PayNexus. */
export function normalizeKenyaPhone(input: string): string {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return digits;
  }
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) {
    return `0${digits}`;
  }
  return digits;
}

export function invoicePaymentReference(invoiceId: string): string {
  return `dma-invoice:${invoiceId}`;
}

export function parseInvoiceIdFromReference(ref: string | null | undefined): string | null {
  if (!ref) return null;
  const m = String(ref).match(/^dma-invoice:([0-9a-f-]{36})$/i);
  return m?.[1] || null;
}
