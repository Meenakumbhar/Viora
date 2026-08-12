import { NextRequest, NextResponse } from 'next/server';
import { setCommentResolution, getUserById } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse, DesignComment, CommentResolutionField } from '@/types/database';

// Designer/employee can only mark their own "fixed" status; proofreader can only
// mark their own "confirmed" status; admin can set either. Enforced here, not
// just hidden in the UI — proxy.ts only gates the /api/staff/* namespace broadly.
function allowedField(role: string): CommentResolutionField[] {
  if (role === 'admin') return ['designer_resolved', 'proofreader_resolved'];
  if (role === 'proofreader') return ['proofreader_resolved'];
  if (role === 'designer' || role === 'employee') return ['designer_resolved'];
  return [];
}

// PATCH /api/staff/orders/[id]/designs/comments/[commentId] — mark a comment
// resolved/unresolved, scoped to the caller's own role.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { commentId } = await params;
    const body = await request.json().catch(() => ({}));
    const field = body?.field;
    const value = Boolean(body?.value);

    if (field !== 'designer_resolved' && field !== 'proofreader_resolved') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "field must be 'designer_resolved' or 'proofreader_resolved'." },
        { status: 400 }
      );
    }
    if (!allowedField(user.role).includes(field)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const updated = await setCommentResolution(commentId, field, value);

    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Comment not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<DesignComment>>({ success: true, data: updated });
  } catch (err) {
    console.error('[staff/orders/:id/designs/comments/:commentId] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
