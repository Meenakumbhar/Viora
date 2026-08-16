import { NextRequest, NextResponse } from 'next/server';
import { auth, forwardSetCookie } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  const authRes = await auth.api.signOut({ headers: request.headers, asResponse: true }).catch(() => null);
  const response = NextResponse.json<ApiResponse>({ success: true, data: null });
  if (authRes) forwardSetCookie(authRes, response);
  return response;
}
