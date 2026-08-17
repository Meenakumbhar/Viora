import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, markOrderPaidRazorpay } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import { RAZORPAY_API_BASE, razorpayAuthHeader, verifyRazorpayPaymentSignature } from '@/lib/razorpay';
import type { ApiResponse, Order } from '@/types/database';

const verifySchema = z.object({
  orderId: z.string().trim().min(1, 'orderId is required.'),
  razorpayOrderId: z.string().trim().min(1, 'razorpayOrderId is required.'),
  razorpayPaymentId: z.string().trim().min(1, 'razorpayPaymentId is required.'),
  razorpaySignature: z.string().trim().min(1, 'razorpaySignature is required.'),
});

// POST /api/payments/razorpay/verify
// Verifies a Razorpay payment after Checkout.js reports success client-side,
// then double-checks the captured amount server-side before marking the
// order paid — the signature alone proves it's a real Razorpay payment, not
// that it's for the right amount.
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, verifySchema, 'payments/razorpay/verify');
    if (parsed.error) return parsed.error;
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json<ApiResponse<Order>>({ success: true, data: order });
    }

    if (!verifyRazorpayPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      console.error('[payments] Razorpay signature verification failed for order', orderId);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment verification failed.' }, { status: 400 });
    }

    // Anti-fraud: pull the actual captured amount from Razorpay rather than
    // trusting anything the client sent.
    const paymentResponse = await fetch(`${RAZORPAY_API_BASE}/payments/${razorpayPaymentId}`, {
      headers: { Authorization: razorpayAuthHeader() },
    });

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}));
      console.error('[payments] Razorpay payment lookup error:', errorData);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment verification failed.' }, { status: 500 });
    }

    const payment = await paymentResponse.json();

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json<ApiResponse>({ success: false, error: `Unexpected payment status: ${payment.status}` }, { status: 400 });
    }

    const expectedAmount = order.payment_amount != null ? Math.round(order.payment_amount * 100) : null;
    if (expectedAmount != null && payment.amount !== expectedAmount) {
      console.error('[payments] Razorpay amount mismatch!', { orderId, captured: payment.amount, expectedAmount });
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment amount mismatch.' }, { status: 400 });
    }

    const updatedOrder = await markOrderPaidRazorpay(orderId, razorpayOrderId, razorpayPaymentId);

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: updatedOrder ?? order,
    });
  } catch (err) {
    console.error('[payments] razorpay verify error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
