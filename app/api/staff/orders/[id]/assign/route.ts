import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, getUserById, assignOrderToDesigner } from '@/lib/db';
import { auth } from '@/lib/auth';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Order } from '@/types/database';

const assignSchema = z.object({
  designerId: z.string().trim().min(1).max(200).nullable(),
});

// POST /api/staff/orders/[id]/assign — route an order to a designer (or unassign
// with designerId: null). Proofreader or admin only — enforced here, since
// proxy.ts only gates the /api/staff/* namespace broadly.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || !['proofreader', 'admin'].includes(user.role)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const parsed = await parseJsonBody(request, assignSchema, 'staff/orders/:id/assign');
    if (parsed.error) return parsed.error;
    const { designerId } = parsed.data;

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
