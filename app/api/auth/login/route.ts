import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, forwardSetCookie } from '@/lib/auth';
import { getUserByEmail, toPublicUser } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { emailSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Password just needs to be present here — it's checked against the stored
// hash, not re-validated for strength (that's signup's job).
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`user-login:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

    if (!allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const parsed = await parseJsonBody(request, loginSchema, 'auth/login');
    if (parsed.error) return parsed.error;
    const { email, password } = parsed.data;

    const authRes = await auth.api.signInEmail({ body: { email, password }, asResponse: true });

    if (!authRes.ok) {
      const body = await authRes.json().catch(() => ({}));
      if (body?.code === 'EMAIL_NOT_VERIFIED') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Please verify your email before logging in. Check your inbox, or request a new link.' },
          { status: 403 }
        );
      }
      return NextResponse.json<ApiResponse>({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
    }

    const user = await getUserByEmail(email);
    const response = NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>({
      success: true,
      data: { user: toPublicUser(user!) },
    });
    forwardSetCookie(authRes, response);
    return response;
  } catch (err) {
    console.error('[auth/login] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
