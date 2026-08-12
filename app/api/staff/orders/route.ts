import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getUserById } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import type { ApiResponse } from '@/types/database';

// GET /api/staff/orders — order list for the staff dashboard (staff role only, gated in proxy.ts).
// Strips payment fields — staff need the design/production context, not billing details.
// A designer only ever sees orders the proofreader has assigned to them.
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionToken(request.cookies.get(USER_SESSION_COOKIE)?.value);
    const user = session ? await getUserById(session.userId) : null;

    const orders = await getAllOrders();
    const visible = user?.role === 'designer' ? orders.filter((o) => o.assigned_designer_id === user.id) : orders;
    const staffOrders = visible.map(({ payment_amount, payment_status, paypal_order_id, ...rest }) => rest);

    return NextResponse.json<ApiResponse<typeof staffOrders>>({ success: true, data: staffOrders });
  } catch (err) {
    console.error('[staff/orders] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
