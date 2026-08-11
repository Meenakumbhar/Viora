import { NextRequest, NextResponse } from 'next/server';
import { getUserById, toPublicUser } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse } from '@/types/database';

// GET /api/auth/me — the current logged-in user, or null
export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
  }

  return NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>({
    success: true,
    data: { user: toPublicUser(user) },
  });
}
