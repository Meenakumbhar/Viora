import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  getUserById,
  getDesignRevisionById,
  proofreaderApproveRevision,
  proofreaderReturnToDesigner,
} from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendDesignReadyEmail, sendDesignReturnedToDesignerEmail } from '@/lib/resend';
import { designCommentsSchema, proofreadBodySchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, DesignRevision, DesignCommentInput } from '@/types/database';

const proofreadSchema = proofreadBodySchema(['approve', 'return_to_designer']);

function sanitizeComments(input: unknown, imageCount: number): DesignCommentInput[] | null {
  const result = designCommentsSchema(imageCount).safeParse(input);
  return result.success ? result.data : null;
}

// POST /api/staff/orders/[id]/designs/[revisionId]/proofread — approve on to the
// customer, or return to the designer with marks. Proofreader or admin only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || !['proofreader', 'admin'].includes(user.role)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { id, revisionId } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const revision = await getDesignRevisionById(revisionId);
    if (!revision || revision.order_id !== id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Design revision not found.' }, { status: 404 });
    }
    // Both states land on the proofreader's desk: a fresh proof awaiting their
    // first look, or a customer's change request awaiting relay to the designer.
    const isFreshProof = revision.status === 'pending_proofreader_review';
    const isRelayingChanges = revision.status === 'changes_requested';
    if (!isFreshProof && !isRelayingChanges) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This revision is not awaiting the proofreader.' },
        { status: 409 }
      );
    }

    const parsed = await parseJsonBody(request, proofreadSchema, 'staff/.../proofread');
    if (parsed.error) return parsed.error;
    const { action, comments: rawComments } = parsed.data;

    if (action === 'approve') {
      // Approving sends this exact revision to the customer — nonsensical for one
      // the customer has already seen and asked changes on.
      if (!isFreshProof) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'The customer has already reviewed this revision — forward it to the designer instead.' },
          { status: 400 }
        );
      }

      const updated = await proofreaderApproveRevision(revisionId);
      if (!updated) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'This revision has already been proofread.' },
          { status: 409 }
        );
      }

      await sendDesignReadyEmail(order, updated.version).catch((err) => {
        console.error('[staff/.../proofread] design-ready email failed:', err);
      });

      return NextResponse.json<ApiResponse<DesignRevision>>({ success: true, data: updated });
    }

    // return_to_designer — a fresh proof needs at least one mark explaining why;
    // a customer's change request already carries its own marks, so more are optional.
    let comments: DesignCommentInput[] = [];
    if (rawComments !== undefined) {
      const sanitized = sanitizeComments(rawComments, revision.image_urls.length);
      if (!sanitized) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid comments.' }, { status: 400 });
      }
      comments = sanitized;
    }
    if (isFreshProof && comments.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Add at least one mark to send this back to the designer.' },
        { status: 400 }
      );
    }

    const updated = await proofreaderReturnToDesigner(revisionId, comments);
    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This revision has already been proofread.' },
        { status: 409 }
      );
    }

    await sendDesignReturnedToDesignerEmail(order, updated.version, comments.length).catch((err) => {
      console.error('[staff/.../proofread] returned-to-designer email failed:', err);
    });

    return NextResponse.json<ApiResponse<DesignRevision>>({ success: true, data: updated });
  } catch (err) {
    console.error('[staff/orders/:id/designs/:revisionId/proofread] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
