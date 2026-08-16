import type { ApiResponse } from '@/types/database';

// A response body isn't guaranteed to be JSON just because the request
// succeeded at the network level — a dev-server hot-reload mid-request, a
// proxy/CDN error page, or a redirect to an HTML page all return non-JSON
// bodies. Calling res.json() unconditionally throws a raw, cryptic
// SyntaxError ("Unexpected token '<' ... is not valid JSON") in that case;
// this wraps that so callers get a message worth showing a user instead.
async function sendJson<T>(method: 'POST' | 'PATCH', url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      res.ok
        ? 'The server sent back something unexpected. Please try again.'
        : `The request failed (${res.status}). Please try again.`
    );
  }

  if (!res.ok || !json.success) {
    throw new Error((!json.success && json.error) || `The request failed (${res.status}).`);
  }

  return json.data;
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return sendJson<T>('POST', url, body);
}

export function patchJson<T>(url: string, body: unknown): Promise<T> {
  return sendJson<T>('PATCH', url, body);
}
