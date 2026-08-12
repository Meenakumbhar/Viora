import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, markOrderPaid } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import { getUserById } from '@/lib/db';
import type { ApiResponse, Order } from '@/types/database';

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
    const cookieHeader = request.headers.get('cookie') ?? '';
    const userSessionMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${USER_SESSION_COOKIE}=([^;]+)`));
    const session = await verifySessionToken(userSessionMatch?.[1]);

    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { paypalOrderId, orderId } = body;

    if (typeof paypalOrderId !== 'string' || !paypalOrderId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'paypalOrderId is required.' }, { status: 400 });
    }
    if (typeof orderId !== 'string' || !orderId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'orderId is required.' }, { status: 400 });
    }

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
