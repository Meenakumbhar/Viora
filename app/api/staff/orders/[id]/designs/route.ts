import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getUserById, createDesignRevision, getDesignRevisionsForOrder } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import { sendDesignReadyForProofreadingEmail } from '@/lib/resend';
import type { ApiResponse, DesignRevision } from '@/types/database';

// GET /api/staff/orders/[id]/designs — list all revisions + comments for an order.
// A designer can only see orders the proofreader has routed to them.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    if (user.role === 'designer') {
      const order = await getOrderById(id);
      if (!order || order.assigned_designer_id !== user.id) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
      }
    }

    const revisions = await getDesignRevisionsForOrder(id);
    return NextResponse.json<ApiResponse<DesignRevision[]>>({ success: true, data: revisions });
  } catch (err) {
    console.error('[staff/orders/:id/designs] GET error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/staff/orders/[id]/designs — upload a new proof, which goes to the
// proofreader first, never straight to the customer. Proofreaders can view
// everything under /api/staff/* but are not allowed to upload, and a designer
// can only upload for an order the proofreader has assigned to them — both
// enforced here since proxy.ts only gates the namespace broadly, not per role.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.userId);
    if (!user || !['designer', 'employee', 'admin'].includes(user.role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Proofreaders cannot upload designs.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (user.role === 'designer' && order.assigned_designer_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This order has not been assigned to you.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((u: unknown) => typeof u === 'string' && u.trim())
      : [];
    const notes = typeof body?.notes === 'string' ? body.notes : null;

    if (imageUrls.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'At least one image URL is required.' },
        { status: 400 }
      );
    }

    let revision;
    try {
      revision = await createDesignRevision({ orderId: id, imageUrls, notes });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A new upload is not allowed right now.';
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 409 });
    }

    await sendDesignReadyForProofreadingEmail(order, revision.version).catch((err) => {
      console.error('[staff/orders/:id/designs] proofreading-notice email failed:', err);
    });

    return NextResponse.json<ApiResponse<DesignRevision>>({ success: true, data: revision }, { status: 201 });
  } catch (err) {
    console.error('[staff/orders/:id/designs] POST error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
