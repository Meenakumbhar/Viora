import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getUserById, assignOrderToDesigner } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse, Order } from '@/types/database';

// POST /api/staff/orders/[id]/assign — route an order to a designer (or unassign
// with designerId: null). Proofreader or admin only — enforced here, since
// proxy.ts only gates the /api/staff/* namespace broadly.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.userId);
    if (!user || !['proofreader', 'admin'].includes(user.role)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const designerId = body?.designerId;

    if (designerId !== null && typeof designerId !== 'string') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'designerId must be a string or null.' }, { status: 400 });
    }

    if (designerId !== null) {
      const designer = await getUserById(designerId);
      if (!designer || designer.role !== 'designer') {
        return NextResponse.json<ApiResponse>({ success: false, error: 'That account is not a designer.' }, { status: 400 });
      }
    }

    const updated = await assignOrderToDesigner(id, designerId);
    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Order>>({ success: true, data: updated });
  } catch (err) {
    console.error('[staff/orders/:id/assign] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
