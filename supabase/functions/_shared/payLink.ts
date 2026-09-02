// Shared signing for public invoice pay links (email → /pay → STK).
// deno-lint-ignore-file

function getPayLinkSecret(): string {
  return (
    Deno.env.get('PAY_LINK_SIGNING_SECRET') ||
    Deno.env.get('PAYNEXUS_WEBHOOK_SECRET') ||
    Deno.env.get('PAYNEXUS_SECRET_KEY') ||
    ''
  );
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function buildPayLinkPayload(invoiceId: string, amount: number, expUnix: number): string {
  return `${invoiceId}.${Math.round(amount)}.${expUnix}`;
}

export async function signPayLink(
  invoiceId: string,
  amount: number,
  expUnix: number,
): Promise<string> {
  const secret = getPayLinkSecret();
  if (!secret) throw new Error('Pay link signing secret is not configured');
  return hmacHex(buildPayLinkPayload(invoiceId, amount, expUnix), secret);
}

export async function verifyPayLink(params: {
  invoiceId: string;
  amount: number;
  expUnix: number;
  signature: string;
}): Promise<{ ok: boolean; error?: string }> {
  const secret = getPayLinkSecret();
  if (!secret) return { ok: false, error: 'Pay link signing not configured' };

  const exp = Number(params.expUnix);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { ok: false, error: 'This payment link has expired. Ask the academy to resend the invoice.' };
  }

  const expected = await hmacHex(
    buildPayLinkPayload(params.invoiceId, params.amount, exp),
    secret,
  );
  const provided = String(params.signature || '').trim().toLowerCase();
  if (expected.length !== provided.length) return { ok: false, error: 'Invalid payment link' };

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  if (diff !== 0) return { ok: false, error: 'Invalid payment link' };
  return { ok: true };
}

export function getPublicSiteOrigin(): string {
  return (
    Deno.env.get('PUBLIC_SITE_URL') ||
    Deno.env.get('PRODUCTION_DOMAIN') ||
    'https://damonmusicacademy.co.ke'
  ).replace(/\/$/, '');
}

/** Build academy-hosted pay URL (avoids broken PayNexus /checkout/s/... page). */
export async function buildAcademyPayUrl(params: {
  invoiceId: string;
  amount: number;
  /** Lifetime in seconds; default 7 days for email usability */
  ttlSeconds?: number;
}): Promise<{ url: string; expUnix: number; signature: string; expiresAtIso: string }> {
  const ttl = params.ttlSeconds ?? 7 * 24 * 60 * 60;
  const expUnix = Math.floor(Date.now() / 1000) + ttl;
  const signature = await signPayLink(params.invoiceId, params.amount, expUnix);
  const origin = getPublicSiteOrigin();
  // If PRODUCTION_DOMAIN is a hash/placeholder, fall back to known site.
  const base =
    origin.includes('http') && !origin.includes('d8df010b')
      ? origin
      : 'https://damonmusicacademy.co.ke';
  const url =
    `${base}/pay?invoice=${encodeURIComponent(params.invoiceId)}` +
    `&amount=${Math.round(params.amount)}` +
    `&exp=${expUnix}` +
    `&sig=${encodeURIComponent(signature)}`;
  return {
    url,
    expUnix,
    signature,
    expiresAtIso: new Date(expUnix * 1000).toISOString(),
  };
}
