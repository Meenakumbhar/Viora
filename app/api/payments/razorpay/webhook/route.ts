import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, markOrderPaidRazorpay } from '@/lib/db';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

// POST /api/payments/razorpay/webhook
// Called by Razorpay's servers, not the browser — there is no user session
// here. The X-Razorpay-Signature header (verified against the raw body) is
// the only trust boundary, so this route must never touch auth.api.getSession.
// Backup reconciliation path alongside the client-driven /verify route — in
// case the customer closes the tab before Checkout.js's handler fires.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[payments] Razorpay webhook received but no webhook secret is configured.');
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error('[payments] Razorpay webhook signature verification failed.');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.notes?.orderId;

    if (!orderId) {
      console.error('[payments] Razorpay webhook: payment.captured with no orderId note', payment?.id);
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      console.error('[payments] Razorpay webhook: order not found for id', orderId);
      return NextResponse.json({ received: true });
    }

    if (order.payment_status === 'paid') {
      // Already reconciled (e.g. the client's own /verify call landed first) — nothing to do.
      return NextResponse.json({ received: true });
    }

    // Anti-fraud: verify the amount actually captured matches what we quoted.
    const expectedAmount = order.payment_amount != null ? Math.round(order.payment_amount * 100) : null;
    if (expectedAmount != null && payment.amount !== expectedAmount) {
      console.error('[payments] Razorpay webhook amount mismatch!', { orderId, captured: payment.amount, expectedAmount });
      return NextResponse.json({ received: true });
    }

    await markOrderPaidRazorpay(orderId, payment.order_id, payment.id);
  }

  return NextResponse.json({ received: true });
}
