import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, setUserVerificationToken } from '@/lib/db';
import { generateToken } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/resend';
import type { ApiResponse } from '@/types/database';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Always returns the same generic message regardless of whether the email is
// registered — avoids leaking which addresses have accounts.
const GENERIC_MESSAGE = 'If an unverified account exists for that email, a new verification link has been sent.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (user && !user.email_verified) {
      const token = generateToken();
      const expires = new Date(Date.now() + TOKEN_TTL_MS);
      await setUserVerificationToken(user.id, token, expires);
      await sendVerificationEmail({ email: user.email, name: user.name, token, baseUrl: request.nextUrl.origin }).catch((err) => {
        console.error('[auth/resend-verification] send failed:', err);
      });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: null, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[auth/resend-verification] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
