import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { emailSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const resendVerificationSchema = z.object({ email: emailSchema });

// Always returns the same generic message regardless of whether the email is
// registered — avoids leaking which addresses have accounts.
const GENERIC_MESSAGE = 'If an unverified account exists for that email, a new verification link has been sent.';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, resendVerificationSchema, 'auth/resend-verification');
    if (parsed.error) return parsed.error;
    const { email } = parsed.data;

    const user = await getUserByEmail(email);

    if (user && !user.email_verified) {
      await auth.api.sendVerificationEmail({ body: { email, callbackURL: '/account?verified=1' } }).catch((err) => {
        console.error('[auth/resend-verification] send failed:', err);
      });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: null, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[auth/resend-verification] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
