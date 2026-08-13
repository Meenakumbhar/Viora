import { NextRequest, NextResponse } from 'next/server';
import { getUserById, toPublicUser } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse, PublicUser } from '@/types/database';

// GET /api/account/me — lets client components (e.g. QuoteForm) check whether
// a customer is logged in and prefill their saved contact details. Returns
// 401 rather than null for "not logged in" so callers can't confuse it with
// a logged-in user who simply has no data yet.
export async function GET(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  return NextResponse.json<ApiResponse<PublicUser>>({ success: true, data: toPublicUser(user) });
}
