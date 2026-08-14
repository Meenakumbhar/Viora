/**
 * Signed session cookie for logged-in customers — separate from the admin
 * password gate in utils/admin-auth.ts. Stateless (no sessions table): the
 * cookie carries the user id and an expiry, HMAC-signed with SESSION_SECRET,
 * verified with the standard Web Crypto API so it works in both Node route
 * handlers and Edge middleware.
 */

export const USER_SESSION_COOKIE = 'user_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

export async function createSessionToken(userId: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  // TODO: SESSION_SECRET not yet configured — sessions disabled until set.
  if (!secret) return '';

  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expires}`;
  const signature = await hmac(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<{ userId: string } | null> {
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;

  const expectedSignature = await hmac(`${userId}.${expiresRaw}`, secret);
  if (signature !== expectedSignature) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return { userId };
}
