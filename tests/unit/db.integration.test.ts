import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDrizzle } from '@/db/client';
import { enquiries, orders, subscribers } from '@/db/schema';
import {
  insertEnquiry,
  getEnquiryById,
  getEnquiriesByEmail,
  createOrder,
  getOrderById,
  setOrderPaymentAmount,
  markOrderPaid,
  markOrderPaidRazorpay,
  getOrderHistory,
  upsertSubscriber,
} from '@/lib/db';

// These hit the real dev database (DATABASE_URL) — every row created here is
// deleted in afterEach so the suite is safe to run repeatedly against a
// shared database, including in CI.
const TEST_EMAIL = `vitest-${Date.now()}@example.test`;

const createdEnquiryIds: string[] = [];
const createdOrderIds: string[] = [];
const createdSubscriberEmails: string[] = [];

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — these integration tests require a real database connection.');
  }
});

afterEach(async () => {
  const db = getDrizzle();
  if (!db) return;

  for (const id of createdOrderIds.splice(0)) {
    await db.delete(orders).where(eq(orders.id, id));
  }
  for (const id of createdEnquiryIds.splice(0)) {
    await db.delete(enquiries).where(eq(enquiries.id, id));
  }
  for (const email of createdSubscriberEmails.splice(0)) {
    await db.delete(subscribers).where(eq(subscribers.email, email));
  }
});

describe('enquiries', () => {
  it('inserts an enquiry and reads it back by id and by email', async () => {
    const enquiry = await insertEnquiry({
      name: 'Vitest Runner',
      email: TEST_EMAIL,
      service_type: 'funeral',
      description: 'Integration test enquiry',
    });
    createdEnquiryIds.push(enquiry.id);

    expect(enquiry.name).toBe('Vitest Runner');
    expect(enquiry.email).toBe(TEST_EMAIL.toLowerCase());
    expect(enquiry.status).toBe('new');

    const byId = await getEnquiryById(enquiry.id);
    expect(byId?.id).toBe(enquiry.id);

    const byEmail = await getEnquiriesByEmail(TEST_EMAIL);
    expect(byEmail.some((e) => e.id === enquiry.id)).toBe(true);
  });

  it('returns null for a nonexistent enquiry id', async () => {
    const result = await getEnquiryById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});

describe('orders — payment lifecycle', () => {
  it('creates an order, sets a payment amount, and reconciles a PayPal payment', async () => {
    const order = await createOrder({
      customer_name: 'Vitest Runner',
      customer_email: TEST_EMAIL,
      service_type: 'Integration test order',
    });
    createdOrderIds.push(order.id);

    expect(order.payment_status).toBe('unpaid');
    expect(order.payment_provider).toBeNull();

    const withAmount = await setOrderPaymentAmount(order.id, 45);
    expect(withAmount?.payment_amount).toBe(45);

    const paid = await markOrderPaid(order.id, 'PAYPAL-TEST-ORDER-ID');
    expect(paid?.payment_status).toBe('paid');
    expect(paid?.payment_provider).toBe('paypal');
    expect(paid?.paypal_order_id).toBe('PAYPAL-TEST-ORDER-ID');

    const history = await getOrderHistory(order.id);
    expect(history.some((h) => h.status === 'pending')).toBe(true);
  });

  it('reconciles a Razorpay payment onto the same schema', async () => {
    const order = await createOrder({
      customer_name: 'Vitest Runner',
      customer_email: TEST_EMAIL,
      service_type: 'Integration test order (razorpay)',
    });
    createdOrderIds.push(order.id);

    const paid = await markOrderPaidRazorpay(order.id, 'order_vitest_test', 'pay_vitest_test');
    expect(paid?.payment_status).toBe('paid');
    expect(paid?.payment_provider).toBe('razorpay');
    expect(paid?.razorpay_order_id).toBe('order_vitest_test');
    expect(paid?.razorpay_payment_id).toBe('pay_vitest_test');
  });

  it('returns null when reading a nonexistent order', async () => {
    const result = await getOrderById('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});

describe('subscribers', () => {
  it('subscribes a new email, then reports it as already subscribed', async () => {
    const email = `vitest-sub-${Date.now()}@example.test`;
    createdSubscriberEmails.push(email);

    const first = await upsertSubscriber({ email });
    expect(first.alreadySubscribed).toBe(false);
    expect(first.subscriber?.active).toBe(true);

    const second = await upsertSubscriber({ email });
    expect(second.alreadySubscribed).toBe(true);
  });
});
