// HMAC signature verification for incoming webhooks.
// Each source (Notion, forge, OpenAI) uses its own secret.
//
// Real impl — constant-time HMAC-SHA256 via Web Crypto (crypto.subtle).
// Expects signature as "sha256=<hex>" or bare "<hex>".
//
// Fails CLOSED when secret is missing — worker must never accept unsigned
// requests in production. For local dev without a secret, set
// ALLOW_UNSIGNED=1 as a binding.

export async function verifyHmac(body, signature, secret, env) {
  if (!secret) {
    if (env && env.ALLOW_UNSIGNED === '1') {
      console.warn('verifyHmac: ALLOW_UNSIGNED=1 — accepting');
      return true;
    }
    console.warn('verifyHmac: no secret configured, rejecting');
    return false;
  }
  if (!signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const hex = signature.replace(/^sha256=/, '').trim();
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return false;
  }

  const sigBytes = hexToBytes(hex);
  return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(body));
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}
