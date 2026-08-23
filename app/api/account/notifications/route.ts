import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getOrdersByEmail, getDesignRevisionsForOrders } from '@/lib/db';
import { auth } from '@/lib/auth';
import { deriveDisplayStage } from '@/lib/order-stage';
import type { ApiResponse } from '@/types/database';

interface NotificationsSummary {
  awaitingReviewCount: number;
}

// GET /api/account/notifications — how many of this customer's orders need
// their attention right now (currently just "awaiting your review", since
// that's the one stage that actually means "you have something to do" — see
// deriveDisplayStage in lib/order-stage.ts). Backs the notification bell in
// JobTicket.tsx — a light, self-contained count rather than reusing
// loadAccountOrders (which redirects on no session, wrong behaviour for an
// API route consumed by fetch).
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const orders = await getOrdersByEmail(user.email, user.id);
  const revisionMap = await getDesignRevisionsForOrders(orders.map((o) => o.id));

  const awaitingReviewCount = orders.filter((order) => {
    const revisions = revisionMap.get(order.id) ?? [];
    const latest = [...revisions].sort((a, b) => b.version - a.version)[0];
    const stage = deriveDisplayStage({
      isPlaced: false,
      orderStatus: order.status,
      paymentStatus: order.payment_status,
      hasPaymentAmount: order.payment_amount !== null && order.payment_amount > 0,
      latestRevisionStatus: latest?.status,
    });
    return stage === 'awaiting_review';
  }).length;

  return NextResponse.json<ApiResponse<NotificationsSummary>>({ success: true, data: { awaitingReviewCount } });
}
