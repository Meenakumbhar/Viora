import { NextRequest, NextResponse } from 'next/server';
import { updateUserRole, toPublicUser } from '@/lib/db';
import { USER_ROLES } from '@/types/database';
import type { ApiResponse, PublicUser } from '@/types/database';

// PATCH /api/admin/users/[id] — change a user's role (admin only, gated in proxy.ts)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const role = body?.role;

    if (typeof role !== 'string' || !USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Role must be one of: ${USER_ROLES.join(', ')}.` },
        { status: 400 }
      );
    }

    const updated = await updateUserRole(id, role as (typeof USER_ROLES)[number]);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<PublicUser>>({ success: true, data: toPublicUser(updated) });
  } catch (err) {
    console.error('[admin/users/:id] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
