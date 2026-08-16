import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, forwardSetCookie } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { passwordSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});

// POST /api/auth/change-password — for a logged-in customer changing their
// own password from the account dashboard (distinct from the forgot-password
// reset flow, which doesn't require knowing the current password).
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { allowed, retryAfterMs } = rateLimit(`change-password:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!allowed) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const parsed = await parseJsonBody(request, changePasswordSchema, 'auth/change-password');
    if (parsed.error) return parsed.error;
    const { currentPassword, newPassword } = parsed.data;

    // asResponse + forwardSetCookie: when revokeOtherSessions is true, Better
    // Auth deletes every session (including this one) and issues a fresh
    // cookie for the caller — without forwarding it, this device would get
    // logged out too instead of just every *other* device.
    const authRes = await auth.api.changePassword({
      headers: request.headers,
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      asResponse: true,
    });

    if (!authRes.ok) {
      const body = await authRes.json().catch(() => ({}));
      const message =
        body?.code === 'INVALID_PASSWORD' ? 'Your current password is incorrect.' : body?.message || 'Could not change your password.';
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 400 });
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: null,
      message: 'Your password has been changed. You\'ve been signed out of every other session.',
    });
    forwardSetCookie(authRes, response);
    return response;
  } catch (err) {
    console.error('[auth/change-password] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
