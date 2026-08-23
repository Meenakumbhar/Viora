import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, getOrderHistory, getLatestDesignRevision, updateOrderStatus } from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/resend';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Order, OrderStatus, OrderWithHistory } from '@/types/database';

const VALID_STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed'];
const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES as [OrderStatus, ...OrderStatus[]]),
  note: z.string().trim().max(2000).nullish(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id] — Fetch a single order with its status timeline (admin only, gated in middleware.ts)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
  }

  const [history, latestRevision] = await Promise.all([
    getOrderHistory(id),
    getLatestDesignRevision(id),
  ]);

  return NextResponse.json<ApiResponse<OrderWithHistory>>({ success: true, data: { ...order, history, latestRevision } });
}

// PUT /api/orders/[id] — Update an order's status (admin only, gated in middleware.ts)
// Sends the customer a status-update email on every change, with an optional note.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, updateStatusSchema, 'orders/:id');
    if (parsed.error) return parsed.error;
    const { status, note } = parsed.data;

    const noteText = note?.trim() || null;
    const order = await updateOrderStatus(id, status, noteText);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    try {
      await sendOrderStatusUpdateEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        service_type: order.service_type,
        status: order.status,
        note: noteText,
      });
    } catch (emailErr) {
      console.error('[orders] status-update-email failed:', emailErr);
    }

    const history = await getOrderHistory(id);

    return NextResponse.json<ApiResponse<OrderWithHistory>>({ success: true, data: { ...order, history } });
  } catch (err) {
    console.error('[orders] update error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update order.' }, { status: 500 });
  }
}
