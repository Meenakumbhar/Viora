import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, toPublicUser } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/auth/me — the current logged-in user, or null
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
  }

  return NextResponse.json<ApiResponse<{ user: ReturnType<typeof toPublicUser> }>>({
    success: true,
    data: { user: toPublicUser(user) },
  });
}
