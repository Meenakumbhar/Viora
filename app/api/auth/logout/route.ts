import { NextResponse } from 'next/server';
import { USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse } from '@/types/database';

export async function POST() {
  const response = NextResponse.json<ApiResponse>({ success: true, data: null });
  response.cookies.set(USER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
