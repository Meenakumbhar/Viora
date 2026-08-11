import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, computeAdminToken } from '@/utils/admin-auth';
import type { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Admin login is not configured. Set ADMIN_PASSWORD in .env.local.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!password || password !== adminPassword) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Incorrect password.' },
      { status: 401 }
    );
  }

  const token = await computeAdminToken(adminPassword);
  const response = NextResponse.json<ApiResponse>({ success: true, data: null });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}
