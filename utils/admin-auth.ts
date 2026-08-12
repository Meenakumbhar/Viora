/**
 * Shared-password admin gate. The session cookie is an HMAC-signed,
 * time-limited token (expiry embedded and signed with the admin password),
 * not a static hash of the password — so a leaked cookie stops working once
 * it expires, and rotating ADMIN_PASSWORD instantly invalidates every
 * outstanding session. Uses the standard Web Crypto API (`crypto.subtle`) so
 * the same check works in both Node route handlers and Proxy.
 */

export const ADMIN_SESSION_COOKIE = 'admin_session';
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createAdminToken(password: string): Promise<string> {
  const expires = Date.now() + ADMIN_SESSION_TTL_MS;
  const payload = `admin.${expires}`;
  const signature = await hmac(payload, password);
  return `${payload}.${signature}`;
}

export async function verifyAdminToken(
  token: string | undefined | null,
  password: string | undefined
): Promise<boolean> {
  if (!token || !password) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [subject, expiresRaw, signature] = parts;
  if (subject !== 'admin') return false;

  const expectedSignature = await hmac(`${subject}.${expiresRaw}`, password);
  if (!timingSafeEqualStr(signature, expectedSignature)) return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}
