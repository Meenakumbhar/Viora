import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import type { ApiResponse } from '@/types/database';

// Shared entry point for Priority 3 of tech-stack-upgrade.md: every route
// handler parses its input through a Zod schema instead of hand-rolled
// `typeof x === 'string'` checks, so invalid input is rejected and logged
// before it reaches the database or triggers a side effect (email, payment).
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  context: string
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  const raw = await request.json().catch(() => undefined);
  const result = schema.safeParse(raw);

  if (!result.success) {
    const first = result.error.issues[0];
    const message = first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid request body.';
    console.error(`[${context}] rejected invalid input:`, result.error.flatten());
    return {
      error: NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 }),
    };
  }

  return { data: result.data };
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>,
  context: string
): { data: T; error?: undefined } | { data?: undefined; error: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);

  if (!result.success) {
    const first = result.error.issues[0];
    const message = first ? `${first.path.join('.') || 'query'}: ${first.message}` : 'Invalid query parameters.';
    console.error(`[${context}] rejected invalid query:`, result.error.flatten());
    return {
      error: NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 }),
    };
  }

  return { data: result.data };
}
