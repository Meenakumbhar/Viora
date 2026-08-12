import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getUserById, getDesignRevisionById, submitDesignReview } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import { sendDesignApprovedEmail, sendDesignChangesRequestedEmail } from '@/lib/resend';
import type { ApiResponse, DesignRevision, DesignCommentInput } from '@/types/database';

const MAX_COMMENT_LENGTH = 2000;

function sanitizeComments(input: unknown, imageCount: number): DesignCommentInput[] | null {
  if (!Array.isArray(input)) return null;

  const cleaned: DesignCommentInput[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return null;
    const { image_index, x, y, comment } = raw as Record<string, unknown>;

    if (typeof image_index !== 'number' || !Number.isInteger(image_index) || image_index < 0 || image_index >= imageCount) {
      return null;
    }
    if (typeof x !== 'number' || x < 0 || x > 1 || typeof y !== 'number' || y < 0 || y > 1) {
      return null;
    }
    if (typeof comment !== 'string' || !comment.trim()) {
      return null;
    }

    cleaned.push({ image_index, x, y, comment: comment.trim().slice(0, MAX_COMMENT_LENGTH) });
  }

  return cleaned;
}

// POST /api/account/orders/[id]/designs/[revisionId]/review — approve or request changes
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id, revisionId } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const revision = await getDesignRevisionById(revisionId);
    if (!revision || revision.order_id !== id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Design revision not found.' }, { status: 404 });
    }
    if (revision.status !== 'pending_review') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This design has already been reviewed.' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'approve' && action !== 'request_changes') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Action must be 'approve' or 'request_changes'." },
        { status: 400 }
      );
    }

    let comments: DesignCommentInput[] = [];
    if (action === 'request_changes') {
      const parsed = sanitizeComments(body?.comments, revision.image_urls.length);
      if (!parsed || parsed.length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Add at least one comment to request changes.' },
          { status: 400 }
        );
      }
      comments = parsed;
    }

    const updated = await submitDesignReview(revisionId, action, comments);
    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This design has already been reviewed.' },
        { status: 409 }
      );
    }

    if (action === 'approve') {
      await sendDesignApprovedEmail(order, updated.version).catch((err) => {
        console.error('[account/.../review] approved email failed:', err);
      });
    } else {
      await sendDesignChangesRequestedEmail(order, updated.version, comments.length).catch((err) => {
        console.error('[account/.../review] changes-requested email failed:', err);
      });
    }

    return NextResponse.json<ApiResponse<DesignRevision>>({ success: true, data: updated });
  } catch (err) {
    console.error('[account/orders/:id/designs/:revisionId/review] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
