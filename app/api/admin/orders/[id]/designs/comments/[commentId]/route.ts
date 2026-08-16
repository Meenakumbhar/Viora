import { NextRequest, NextResponse } from 'next/server';
import { setCommentResolution } from '@/lib/db';
import { commentResolutionSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, DesignComment } from '@/types/database';

// PATCH /api/admin/orders/[id]/designs/comments/[commentId] — mark a comment
// resolved/unresolved. Admin has full authority, so either field is allowed.
// (admin only, gated in proxy.ts)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { commentId } = await params;
    const parsed = await parseJsonBody(request, commentResolutionSchema, 'admin/.../comments/:commentId');
    if (parsed.error) return parsed.error;
    const { field, value } = parsed.data;

    const updated = await setCommentResolution(commentId, field, value);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Comment not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<DesignComment>>({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/orders/:id/designs/comments/:commentId] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
