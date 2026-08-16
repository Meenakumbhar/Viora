import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { emailSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const forgotPasswordSchema = z.object({ email: emailSchema });

// Better Auth's own requestPasswordReset already returns the same generic
// response whether or not the account exists (and simulates the DB lookup
// either way to resist timing attacks) — no need to duplicate that here.
const GENERIC_MESSAGE = 'If an account exists for that email, we\'ve sent a link to reset your password.';

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`forgot-password:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

    if (!allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const parsed = await parseJsonBody(request, forgotPasswordSchema, 'auth/forgot-password');
    if (parsed.error) return parsed.error;
    const { email } = parsed.data;

    await auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } }).catch((err) => {
      console.error('[auth/forgot-password] requestPasswordReset failed:', err);
    });

    return NextResponse.json<ApiResponse>({ success: true, data: null, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[auth/forgot-password] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
