import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, toPublicUser } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse } from '@/types/database';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!EMAIL_REGEX.test(email) || !password) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Please enter your email and password.' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;

    if (!user || !passwordOk) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
    }

    if (!user.email_verified) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Please verify your email before logging in. Check your inbox, or request a new link.' },
        { status: 403 }
      );
    }

    const token = await createSessionToken(user.id);
    const response = NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>({
      success: true,
      data: { user: toPublicUser(user) },
    });
    response.cookies.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (err) {
    console.error('[auth/login] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
