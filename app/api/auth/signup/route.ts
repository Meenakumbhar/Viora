import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, setUserVerificationToken, toPublicUser } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/resend';
import type { ApiResponse } from '@/types/database';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// POST /api/auth/signup — Create an account and email a verification link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const baseUrl = request.nextUrl.origin;
    const existing = await getUserByEmail(email);

    if (existing && existing.email_verified) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'An account with this email already exists. Try logging in instead.' },
        { status: 409 }
      );
    }

    const token = generateToken();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    if (existing && !existing.email_verified) {
      // They signed up before but never verified — refresh the token and resend rather than erroring.
      await setUserVerificationToken(existing.id, token, expires);
      await sendVerificationEmail({ email: existing.email, name: existing.name, token, baseUrl }).catch((err) => {
        console.error('[auth/signup] resend verification email failed:', err);
      });
      return NextResponse.json<ApiResponse>({
        success: true,
        data: null,
        message: 'An account with this email already exists but is not verified. We\'ve sent a new verification link.',
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, name, verificationToken: token, verificationTokenExpires: expires });

    try {
      await sendVerificationEmail({ email: user.email, name: user.name, token, baseUrl });
    } catch (emailErr) {
      console.error('[auth/signup] verification email failed:', emailErr);
    }

    return NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>(
      { success: true, data: { user: toPublicUser(user) }, message: 'Check your email to verify your account.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[auth/signup] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
