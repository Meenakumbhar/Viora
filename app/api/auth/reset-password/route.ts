import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { passwordSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required.'),
  newPassword: passwordSchema,
});

// POST /api/auth/reset-password
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`reset-password:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

    if (!allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const parsed = await parseJsonBody(request, resetPasswordSchema, 'auth/reset-password');
    if (parsed.error) return parsed.error;
    const { token, newPassword } = parsed.data;

    try {
      await auth.api.resetPassword({ body: { newPassword, token } });
    } catch (err: any) {
      const code = err?.body?.code;
      const message =
        code === 'INVALID_TOKEN'
          ? 'This reset link is invalid or has expired. Please request a new one.'
          : err?.body?.message || 'Could not reset your password. Please try again.';
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: null, message: 'Your password has been reset. You can now log in.' });
  } catch (err) {
    console.error('[auth/reset-password] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
