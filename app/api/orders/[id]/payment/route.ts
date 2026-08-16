import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setOrderPaymentAmount, getOrderById, getOrderHistory } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, OrderWithHistory } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const setPaymentSchema = z.object({
  amount: z.coerce.number().positive('A valid positive amount is required.').finite(),
});

// PATCH /api/orders/[id]/payment — Admin sets the payment amount for an order
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, setPaymentSchema, 'orders/:id/payment');
    if (parsed.error) return parsed.error;

    // Round to 2 decimal places
    const rounded = Math.round(parsed.data.amount * 100) / 100;

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
