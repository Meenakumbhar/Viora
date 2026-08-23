import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, getOrderPaymentGate } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import { RAZORPAY_API_BASE, isRazorpayConfigured, razorpayAuthHeader } from '@/lib/razorpay';
import type { ApiResponse } from '@/types/database';

const createOrderSchema = z.object({ orderId: z.string().trim().min(1, 'orderId is required.') });

// POST /api/payments/razorpay/create-order
// Creates a Razorpay order for a given internal order ID.
// Only the logged-in user who owns the order can call this.
export async function POST(request: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Card payments are not configured.' }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, createOrderSchema, 'payments/razorpay/create-order');
    if (parsed.error) return parsed.error;
    const { orderId } = parsed.data;

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'This order is already paid.' }, { status: 400 });
    }

    if (!order.payment_amount || order.payment_amount <= 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No payment amount set for this order yet.' }, { status: 400 });
    }

    const gate = await getOrderPaymentGate(order.id);
    if (!gate.payable) {
      return NextResponse.json<ApiResponse>({ success: false, error: gate.reason }, { status: 409 });
    }

    const razorpayResponse = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: 'POST',
      headers: {
        Authorization: razorpayAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Razorpay orders are denominated in the smallest currency unit (pence, not pounds).
        amount: Math.round(order.payment_amount * 100),
        currency: 'GBP',
        receipt: order.id,
        notes: { orderId: order.id, service_type: order.service_type },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json().catch(() => ({}));
      console.error('[payments] Razorpay create-order error:', errorData);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create Razorpay order.' }, { status: 500 });
    }

    const razorpayOrder = await razorpayResponse.json();

    return NextResponse.json<ApiResponse<{ razorpayOrderId: string; amount: number; currency: string }>>({
      success: true,
      data: { razorpayOrderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
    });
  } catch (err) {
    console.error('[payments] razorpay create-order error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
