import { NextRequest, NextResponse } from 'next/server';
import { verifyUserByToken } from '@/lib/db';
import { createSessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';

// GET /api/auth/verify?token=... — clicked from the verification email
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  const user = await verifyUserByToken(token);

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  const sessionToken = await createSessionToken(user.id);
  const response = NextResponse.redirect(new URL('/account?verified=1', request.url));
  response.cookies.set(USER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
