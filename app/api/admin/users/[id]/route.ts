import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateUserRole, toPublicUser } from '@/lib/db';
import { USER_ROLES } from '@/types/database';
import { userRoleSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, PublicUser } from '@/types/database';

const updateRoleSchema = z.object({ role: userRoleSchema });

// PATCH /api/admin/users/[id] — change a user's role (admin only, gated in proxy.ts)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, updateRoleSchema, 'admin/users/:id');
    if (parsed.error) return parsed.error;
    const { role } = parsed.data;

    // userRoleSchema already validated `role` is one of USER_ROLES at runtime.
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
