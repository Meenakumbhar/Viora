import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, createDesignRevision, getDesignRevisionsForOrder } from '@/lib/db';
import { sendDesignReadyForProofreadingEmail } from '@/lib/resend';
import { designUploadSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
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

    const parsed = await parseJsonBody(request, designUploadSchema, 'admin/orders/:id/designs');
    if (parsed.error) return parsed.error;
    const { imageUrls, notes } = parsed.data;

    let revision;
    try {
      revision = await createDesignRevision({ orderId: id, imageUrls, notes: notes ?? null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A new upload is not allowed right now.';
      return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 409 });
    }

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
