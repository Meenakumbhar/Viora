import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getUserByEmail, toPublicUser } from '@/lib/db';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { emailSchema, passwordSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(200).optional(),
});

const VERIFIED_CALLBACK_URL = '/account?verified=1';

// POST /api/auth/signup — Create an account and email a verification link
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`signup:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

    if (!allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const parsed = await parseJsonBody(request, signupSchema, 'auth/signup');
    if (parsed.error) return parsed.error;
    const { email, password, name } = parsed.data;

    const existing = await getUserByEmail(email);

    if (existing && existing.email_verified) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 }
      );
    }

    if (existing && !existing.email_verified) {
      // They signed up before but never verified — resend rather than erroring.
      await auth.api.sendVerificationEmail({ body: { email, callbackURL: VERIFIED_CALLBACK_URL } }).catch((err) => {
        console.error('[auth/signup] resend verification email failed:', err);
      });
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: 'An account with this email already exists but is not verified. We\'ve sent a new verification link.',
      });
    }

    let signUpResult;
    try {
      signUpResult = await auth.api.signUpEmail({
        body: { email, password, name: name ?? '', callbackURL: VERIFIED_CALLBACK_URL },
      });
    } catch (err: any) {
      const message = err?.body?.message || err?.message || 'Something went wrong. Please try again.';
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: err?.status === 'UNPROCESSABLE_ENTITY' ? 422 : 400 });
    }

    const user = await getUserByEmail(signUpResult.user.email);

    return NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>(
      { success: true, data: { user: toPublicUser(user!) }, message: 'Check your email to verify your account.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[auth/signup] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
