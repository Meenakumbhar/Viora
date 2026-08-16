import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getUserById, getDesignRevisionById, submitDesignReview } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendDesignApprovedEmail, sendDesignChangesRequestedEmail } from '@/lib/resend';
import { designCommentsSchema, proofreadBodySchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, DesignRevision, DesignCommentInput } from '@/types/database';

const reviewSchema = proofreadBodySchema(['approve', 'request_changes']);

function sanitizeComments(input: unknown, imageCount: number): DesignCommentInput[] | null {
  const result = designCommentsSchema(imageCount).safeParse(input);
  return result.success ? result.data : null;
}

// POST /api/account/orders/[id]/designs/[revisionId]/review — approve or request changes
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
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

    const parsedBody = await parseJsonBody(request, reviewSchema, 'account/.../review');
    if (parsedBody.error) return parsedBody.error;
    const { action, comments: rawComments } = parsedBody.data;

    let comments: DesignCommentInput[] = [];
    if (action === 'request_changes') {
      const sanitized = sanitizeComments(rawComments, revision.image_urls.length);
      if (!sanitized || sanitized.length === 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Add at least one comment to request changes.' },
          { status: 400 }
        );
      }
      comments = sanitized;
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
