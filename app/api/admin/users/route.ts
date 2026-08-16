import { NextResponse } from 'next/server';
import { getAllUsers, toPublicUser } from '@/lib/db';
import type { ApiResponse, PublicUser } from '@/types/database';

// GET /api/admin/users — list all accounts with their role (admin only, gated in proxy.ts)
export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json<ApiResponse<PublicUser[]>>({
      success: true,
      data: users.map(toPublicUser),
    });
  } catch (err) {
    console.error('[admin/users] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
