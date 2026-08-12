import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getUserById, getDesignRevisionsForCustomer } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse, DesignRevision } from '@/types/database';

// GET /api/account/orders/[id]/designs — the logged-in customer's own revisions + comments for an order
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
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const revisions = await getDesignRevisionsForCustomer(id);
    return NextResponse.json<ApiResponse<DesignRevision[]>>({ success: true, data: revisions });
  } catch (err) {
    console.error('[account/orders/:id/designs] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
