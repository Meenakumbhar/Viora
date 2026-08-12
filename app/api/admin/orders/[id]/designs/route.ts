import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, createDesignRevision, getDesignRevisionsForOrder } from '@/lib/db';
import { sendDesignReadyForProofreadingEmail } from '@/lib/resend';
import type { ApiResponse, DesignRevision } from '@/types/database';

// GET /api/admin/orders/[id]/designs — list all revisions + comments for an order (admin only, gated in proxy.ts)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const revisions = await getDesignRevisionsForOrder(id);
    return NextResponse.json<ApiResponse<DesignRevision[]>>({ success: true, data: revisions });
  } catch (err) {
    console.error('[admin/orders/:id/designs] GET error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/orders/[id]/designs — upload a new proof for review (admin only, gated in proxy.ts)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
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

    const revision = await createDesignRevision({ orderId: id, imageUrls, notes });

    await sendDesignReadyForProofreadingEmail(order, revision.version).catch((err) => {
      console.error('[admin/orders/:id/designs] proofreading-notice email failed:', err);
    });

    return NextResponse.json<ApiResponse<DesignRevision>>({ success: true, data: revision }, { status: 201 });
  } catch (err) {
    console.error('[admin/orders/:id/designs] POST error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
