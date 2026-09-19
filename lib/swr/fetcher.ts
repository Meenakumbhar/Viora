import type { ApiResponse } from '@/types/database';

/**
 * Shared SWR fetcher for this app's route handlers.
 *
 * Every handler in app/api replies with the same envelope
 * ({ success: true, data } | { success: false, error }), so unwrapping it
 * here keeps that shape out of every component that reads data.
 *
 * A non-JSON body is treated as a failure rather than crashing with a raw
 * SyntaxError — the same reasoning as lib/api-client.ts: a dev-server reload
 * mid-request, a proxy error page, or a redirect to HTML all return non-JSON.
 */
export async function apiFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

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
