import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_SESSION_COOKIE, createAdminToken } from '@/utils/admin-auth';
import { rateLimit, getClientIp, timingSafeEqualStr } from '@/lib/rate-limit';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse } from '@/types/database';

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const adminLoginSchema = z.object({ password: z.string().min(1, 'Password is required.') });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`admin-login:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);

  if (!allowed) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Admin login is not configured. Set ADMIN_PASSWORD in .env.local.' },
      { status: 500 }
    );
  }

  const parsed = await parseJsonBody(request, adminLoginSchema, 'admin/login');
  if (parsed.error) return parsed.error;
  const { password } = parsed.data;

  if (!timingSafeEqualStr(password, adminPassword)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Incorrect password.' },
      { status: 401 }
    );
  }

  const token = await createAdminToken(adminPassword);
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
