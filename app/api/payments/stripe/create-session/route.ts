import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderById } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import { stripe } from '@/lib/stripe';
import type { ApiResponse } from '@/types/database';

const createSessionSchema = z.object({ orderId: z.string().trim().min(1, 'orderId is required.') });

// POST /api/payments/stripe/create-session
// Creates a Stripe Checkout Session for a given internal order ID.
// Only the logged-in user who owns the order can call this.
export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
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

    const parsed = await parseJsonBody(request, createSessionSchema, 'payments/stripe/create-session');
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

    const origin = request.nextUrl.origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: `${order.service_type} — Memories in Prints` },
            unit_amount: Math.round(order.payment_amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.id },
      success_url: `${origin}/account?stripe=success&order=${order.id}`,
      cancel_url: `${origin}/account?stripe=cancelled&order=${order.id}`,
    });

    if (!checkoutSession.url) {
      console.error('[payments] Stripe session created without a url:', checkoutSession.id);
      return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to start checkout.' }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<{ url: string }>>({
      success: true,
      data: { url: checkoutSession.url },
    });
  } catch (err) {
    console.error('[payments] stripe create-session error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
