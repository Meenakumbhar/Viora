import { NextRequest, NextResponse } from 'next/server';
import { setOrderPaymentAmount, getOrderById, getOrderHistory } from '@/lib/db';
import type { ApiResponse, OrderWithHistory } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/orders/[id]/payment — Admin sets the payment amount for an order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { amount } = body;

    const parsed = Number(amount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'A valid positive amount is required.' }, { status: 400 });
    }

    // Round to 2 decimal places
    const rounded = Math.round(parsed * 100) / 100;

    const order = await setOrderPaymentAmount(id, rounded);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const history = await getOrderHistory(id);

    return NextResponse.json<ApiResponse<OrderWithHistory>>({ success: true, data: { ...order, history } });
  } catch (err) {
    console.error('[orders] set-payment-amount error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update payment amount.' }, { status: 500 });
  }
}
