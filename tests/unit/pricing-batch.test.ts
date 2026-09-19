import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Order, PortfolioItemRef } from '@/types/database';

// syncOrderPricingForOrders reimplements the price-resolution precedence that
// getEffectivePrice / getEffectiveProductPrice apply one order at a time, so
// these tests pin that precedence down directly. This decides what a customer
// is charged — a silent regression here is a billing bug, not a UI glitch.
//
// lib/db is mocked rather than hit: the point is the resolution rules and the
// query-shape guarantee (a fixed number of reads, writes only for orders whose
// price actually moved), neither of which needs a real database.

const queries = {
  portfolioPrices: [] as unknown[],
  customerItemPrices: [] as unknown[],
  productPrices: [] as unknown[],
  customerProductPrices: [] as unknown[],
  products: [] as unknown[],
};

const calls = { reads: 0, writes: [] as Array<{ id: string; amount: number }> };

vi.mock('@/lib/db', () => ({
  getAllPortfolioItemPrices: vi.fn(async () => {
    calls.reads++;
    return queries.portfolioPrices;
  }),
  getAllCustomerItemPrices: vi.fn(async () => {
    calls.reads++;
    return queries.customerItemPrices;
  }),
  getAllProductPrices: vi.fn(async () => {
    calls.reads++;
    return queries.productPrices;
  }),
  getAllCustomerProductPrices: vi.fn(async () => {
    calls.reads++;
    return queries.customerProductPrices;
  }),
  getRelatedProducts: vi.fn(async () => {
    calls.reads++;
    return queries.products;
  }),
  setOrderPaymentAmount: vi.fn(async (id: string, amount: number) => {
    calls.writes.push({ id, amount });
    return { ...orderById(id), payment_amount: amount };
  }),
  // Re-exported by lib/data/pricing but unused in these paths.
  getPortfolioItemPrice: vi.fn(),
  upsertPortfolioItemPrice: vi.fn(),
  getCustomerItemPrice: vi.fn(),
  upsertCustomerItemPrice: vi.fn(),
  getEffectivePrice: vi.fn(),
  getProductPrice: vi.fn(),
  getProductPricesForProduct: vi.fn(),
  upsertProductPrice: vi.fn(),
  getCustomerProductPrice: vi.fn(),
  upsertCustomerProductPrice: vi.fn(),
  getEffectiveProductPrice: vi.fn(),
  syncOrderPricingFromCatalog: vi.fn(),
}));

const { syncOrderPricingForOrders } = await import('@/lib/data/pricing');

let allOrders: Order[] = [];
function orderById(id: string): Order {
  return allOrders.find((o) => o.id === id)!;
}

function makeOrder(over: Partial<Order> & { id: string }): Order {
  return {
    enquiry_id: null,
    user_id: null,
    customer_name: 'Test',
    customer_email: 'a@b.com',
    service_type: 'wedding',
    event_date: null,
    quantity_estimate: null,
    details: null,
    portfolio_items: null,
    status: 'new',
    payment_status: 'unpaid',
    payment_amount: null,
    payment_provider: null,
    paypal_order_id: null,
    razorpay_order_id: null,
    razorpay_payment_id: null,
    assigned_designer_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...over,
  } as Order;
}

const ref = (id: string): PortfolioItemRef => ({ id, title: 't', category: 'wedding' });

beforeEach(() => {
  queries.portfolioPrices = [];
  queries.customerItemPrices = [];
  queries.productPrices = [];
  queries.customerProductPrices = [];
  queries.products = [];
  calls.reads = 0;
  calls.writes = [];
  allOrders = [];
});

async function run(orders: Order[], userId: (o: Order) => string | null = () => null) {
  allOrders = orders;
  return syncOrderPricingForOrders(orders, userId);
}

describe('syncOrderPricingForOrders', () => {
  it('never reprices a paid order', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 999, currency: 'GBP' }];
    const orders = [
      makeOrder({ id: 'o1', payment_status: 'paid', payment_amount: 10, portfolio_items: [ref('item-1')] }),
    ];

    const result = await run(orders);

    expect(result[0].payment_amount).toBe(10);
    expect(calls.writes).toEqual([]);
  });

  it('prefers a customer-specific price over the catalog price', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    queries.customerItemPrices = [
      { user_id: 'u1', portfolio_item_id: 'item-1', price: 400, currency: 'GBP' },
    ];
    const orders = [makeOrder({ id: 'o1', payment_amount: 0, portfolio_items: [ref('item-1')] })];

    const result = await run(orders, () => 'u1');

    expect(result[0].payment_amount).toBe(400);
    expect(calls.writes).toEqual([{ id: 'o1', amount: 400 }]);
  });

  it('falls back to the catalog price when the customer has no negotiated price', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    queries.customerItemPrices = [
      { user_id: 'someone-else', portfolio_item_id: 'item-1', price: 400, currency: 'GBP' },
    ];
    const orders = [makeOrder({ id: 'o1', payment_amount: 0, portfolio_items: [ref('item-1')] })];

    const result = await run(orders, () => 'u1');

    expect(result[0].payment_amount).toBe(500);
  });

  it('resolves composite slug::size ids through the product catalog', async () => {
    queries.products = [{ id: 'p1', slug: 'memory-cards' }];
    queries.productPrices = [{ product_id: 'p1', size_label: 'A5', price: 250, currency: 'GBP' }];
    const orders = [
      makeOrder({ id: 'o1', payment_amount: 0, portfolio_items: [ref('memory-cards::A5')] }),
    ];

    const result = await run(orders);

    expect(result[0].payment_amount).toBe(250);
  });

  it('honours a negotiated product price for the composite id path', async () => {
    queries.products = [{ id: 'p1', slug: 'memory-cards' }];
    queries.productPrices = [{ product_id: 'p1', size_label: 'A5', price: 250, currency: 'GBP' }];
    queries.customerProductPrices = [
      { user_id: 'u1', product_id: 'p1', size_label: 'A5', price: 199, currency: 'GBP' },
    ];
    const orders = [
      makeOrder({ id: 'o1', payment_amount: 0, portfolio_items: [ref('memory-cards::A5')] }),
    ];

    const result = await run(orders, () => 'u1');

    expect(result[0].payment_amount).toBe(199);
  });

  it('ignores a composite id whose slug is not a published product', async () => {
    queries.products = [];
    queries.productPrices = [{ product_id: 'p1', size_label: 'A5', price: 250, currency: 'GBP' }];
    const orders = [
      makeOrder({ id: 'o1', payment_amount: 7, portfolio_items: [ref('unpublished::A5')] }),
    ];

    const result = await run(orders);

    expect(result[0].payment_amount).toBe(7);
    expect(calls.writes).toEqual([]);
  });

  it('leaves orders that do not reference exactly one piece alone', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    const orders = [
      makeOrder({ id: 'none', payment_amount: 1, portfolio_items: [] }),
      makeOrder({ id: 'many', payment_amount: 2, portfolio_items: [ref('item-1'), ref('item-2')] }),
      makeOrder({ id: 'null', payment_amount: 3, portfolio_items: null }),
    ];

    const result = await run(orders);

    expect(result.map((o) => o.payment_amount)).toEqual([1, 2, 3]);
    expect(calls.writes).toEqual([]);
  });

  it('does not write when the price is already in sync', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    const orders = [makeOrder({ id: 'o1', payment_amount: 500, portfolio_items: [ref('item-1')] })];

    await run(orders);

    expect(calls.writes).toEqual([]);
  });

  it('keeps reads constant as the order count grows', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    const many = Array.from({ length: 50 }, (_, i) =>
      makeOrder({ id: `o${i}`, payment_amount: 500, portfolio_items: [ref('item-1')] })
    );

    await run(many);

    // Portfolio path only: the two item-price tables. The product tables and
    // the slug lookup are skipped entirely when no composite ids are present.
    expect(calls.reads).toBe(2);
  });

  it('returns every order, in the original order, including untouched ones', async () => {
    queries.portfolioPrices = [{ portfolio_item_id: 'item-1', price: 500, currency: 'GBP' }];
    const orders = [
      makeOrder({ id: 'a', payment_amount: 0, portfolio_items: [ref('item-1')] }),
      makeOrder({ id: 'b', payment_status: 'paid', payment_amount: 42, portfolio_items: [ref('item-1')] }),
      makeOrder({ id: 'c', payment_amount: 9, portfolio_items: null }),
    ];

    const result = await run(orders);

    expect(result.map((o) => o.id)).toEqual(['a', 'b', 'c']);
    expect(result.map((o) => o.payment_amount)).toEqual([500, 42, 9]);
  });
});
