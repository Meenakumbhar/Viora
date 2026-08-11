/**
 * Lightweight shared-password admin gate.
 *
 * Not a full auth system — one shared password, one session cookie whose value
 * is a SHA-256 hash of that password. Uses the standard Web Crypto API (`crypto.subtle`)
 * so the same check works in both Node route handlers and Edge middleware.
 */

export const ADMIN_SESSION_COOKIE = 'admin_session';

export async function computeAdminToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
