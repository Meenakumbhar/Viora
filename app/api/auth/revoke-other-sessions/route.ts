import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types/database';

// POST /api/auth/revoke-other-sessions — "sign out of all other devices"
// without changing the password. Never touches the caller's own session.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  try {
    await auth.api.revokeOtherSessions({ headers: request.headers });
  } catch (err) {
    console.error('[auth/revoke-other-sessions] error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Could not sign out other devices. Please try again.' }, { status: 500 });
  }

  return NextResponse.json<ApiResponse>({ success: true, data: null, message: 'Signed out of every other device.' });
}
