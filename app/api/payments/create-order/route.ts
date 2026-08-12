import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import { getUserById } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

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

// POST /api/payments/create-order
// Creates a PayPal order for a given internal order ID.
// Only the logged-in user who owns the order can call this.
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
    const { orderId } = body;

    if (typeof orderId !== 'string' || !orderId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'orderId is required.' }, { status: 400 });
    }

    // Fetch and validate the order
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    // Only the order owner can pay
    if (order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json<ApiResponse>({ success: false, error: 'This order is already paid.' }, { status: 400 });
    }

    if (!order.payment_amount || order.payment_amount <= 0) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'No payment amount set for this order yet.' }, { status: 400 });
    }

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();

    const paypalResponse = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: order.id,
            description: `${order.service_type} — Memories in Prints`,
            amount: {
              currency_code: 'GBP',
              value: order.payment_amount.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!paypalResponse.ok) {
      const errorData = await paypalResponse.json().catch(() => ({}));
      console.error('[payments] PayPal create-order error:', errorData);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create PayPal order.' }, { status: 500 });
    }

    const paypalOrder = await paypalResponse.json();

    return NextResponse.json<ApiResponse<{ paypalOrderId: string }>>({
      success: true,
      data: { paypalOrderId: paypalOrder.id },
    });
  } catch (err) {
    console.error('[payments] create-order error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
