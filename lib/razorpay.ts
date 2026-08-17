import crypto from 'crypto';

// No official lightweight SDK is used here — same choice already made for
// PayPal elsewhere in this app: plain REST calls with Basic Auth, so there's
// nothing to lazily construct or leave uninitialized when keys are missing.
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

export function isRazorpayConfigured(): boolean {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

export function razorpayAuthHeader(): string {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured.');
  }
  return `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
}

// Razorpay's own recipe for verifying a client-reported payment: HMAC-SHA256
// of "order_id|payment_id" signed with the key secret, compared against the
// signature the client got back from Checkout.js. This is what proves the
// payment was genuinely authorized by Razorpay and not just claimed by the browser.
export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return timingSafeEqual(expected, signature);
}

// Webhook payloads are signed the same HMAC-SHA256 way, but over the raw
// request body and with the separate webhook secret configured in the
// Razorpay dashboard, not the API key secret.
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
