import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById, markOrderPaid } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Order } from '@/types/database';

const captureOrderSchema = z.object({
  paypalOrderId: z.string().trim().min(1, 'paypalOrderId is required.'),
  orderId: z.string().trim().min(1, 'orderId is required.'),
});

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// POST /api/payments/capture-order
// Captures a PayPal order after the customer approves it.
// Verifies the captured amount matches the expected amount (anti-fraud).
export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, captureOrderSchema, 'payments/capture-order');
    if (parsed.error) return parsed.error;
    const { paypalOrderId, orderId } = parsed.data;

    // Validate the internal order
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

    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json().catch(() => ({}));
      console.error('[payments] PayPal capture error:', errorData);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment capture failed.' }, { status: 500 });
    }

    const captureData = await captureResponse.json();

    // Verify the payment was actually completed
    const captureStatus = captureData?.status;
    const capturedAmount = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;

    if (captureStatus !== 'COMPLETED') {
      return NextResponse.json<ApiResponse>({ success: false, error: `Unexpected payment status: ${captureStatus}` }, { status: 400 });
    }

    // Anti-fraud: verify captured amount matches expected
    if (order.payment_amount && Math.abs(Number(capturedAmount) - order.payment_amount) > 0.01) {
      console.error('[payments] Amount mismatch!', { captured: capturedAmount, expected: order.payment_amount });
      return NextResponse.json<ApiResponse>({ success: false, error: 'Payment amount mismatch.' }, { status: 400 });
    }

    // Mark order as paid in database
    const updatedOrder = await markOrderPaid(orderId, paypalOrderId);

    return NextResponse.json<ApiResponse<Order>>({
      success: true,
      data: updatedOrder ?? order,
    });
  } catch (err) {
    console.error('[payments] capture-order error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
