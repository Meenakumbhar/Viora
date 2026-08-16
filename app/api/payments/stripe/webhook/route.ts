import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, markOrderPaidStripe } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

// POST /api/payments/stripe/webhook
// Called by Stripe's servers, not the browser — there is no user session here.
// The Stripe-Signature header (verified against the raw body) is the only
// trust boundary, so this route must never touch auth.api.getSession.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error('[payments] Stripe webhook received but Stripe is not configured.');
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[payments] Stripe webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const orderId = checkoutSession.metadata?.orderId;

    if (!orderId) {
      console.error('[payments] Stripe webhook: checkout.session.completed with no orderId metadata', checkoutSession.id);
      return NextResponse.json({ received: true });
    }

    if (checkoutSession.payment_status !== 'paid') {
      console.warn('[payments] Stripe webhook: session completed but payment_status is', checkoutSession.payment_status);
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      console.error('[payments] Stripe webhook: order not found for id', orderId);
      return NextResponse.json({ received: true });
    }

    if (order.payment_status === 'paid') {
      // Already reconciled (e.g. Stripe retried the webhook) — nothing to do.
      return NextResponse.json({ received: true });
    }

    // Anti-fraud: verify the amount actually captured matches what we quoted.
    const amountTotal = checkoutSession.amount_total;
    const expectedAmount = order.payment_amount != null ? Math.round(order.payment_amount * 100) : null;
    if (expectedAmount != null && amountTotal !== expectedAmount) {
      console.error('[payments] Stripe amount mismatch!', { orderId, amountTotal, expectedAmount });
      return NextResponse.json({ received: true });
    }

    await markOrderPaidStripe(orderId, checkoutSession.id);
  }

  return NextResponse.json({ received: true });
}
