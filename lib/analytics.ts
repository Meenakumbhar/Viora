import type { Order, OrderStatus } from '@/types/database';

export interface MonthPoint {
  label: string; // e.g. "Mar"
  value: number;
}

export interface StatusBreakdownPoint {
  status: OrderStatus;
  count: number;
}

export interface ClientKpis {
  avgOrderValue: number;
  repeatCustomerRate: number; // 0–1
  topClient: { name: string; orderCount: number } | null;
}

function lastNMonths(n: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('en-GB', { month: 'short' }),
    });
  }
  return months;
}

// Sum of paid-order revenue, grouped by month, for the last `months` months.
export function getRevenueTrend(orders: Order[], months = 6): MonthPoint[] {
  const buckets = lastNMonths(months);
  const sums = new Map(buckets.map((b) => [b.key, 0]));

  for (const order of orders) {
    if (order.payment_status !== 'paid' || !order.payment_amount) continue;
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (sums.has(key)) {
      sums.set(key, (sums.get(key) ?? 0) + order.payment_amount);
    }
  }

  return buckets.map((b) => ({ label: b.label, value: Math.round((sums.get(b.key) ?? 0) * 100) / 100 }));
}

// Order count, grouped by month, for the last `months` months.
export function getOrderVolumeTrend(orders: Order[], months = 6): MonthPoint[] {
  const buckets = lastNMonths(months);
  const counts = new Map(buckets.map((b) => [b.key, 0]));

  for (const order of orders) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

export function getStatusBreakdown(orders: Order[]): StatusBreakdownPoint[] {
  const statuses: OrderStatus[] = ['pending', 'in_progress', 'completed'];
  return statuses.map((status) => ({ status, count: orders.filter((o) => o.status === status).length }));
}

export function getClientKpis(orders: Order[]): ClientKpis {
  const paidOrders = orders.filter((o) => o.payment_status === 'paid' && o.payment_amount);
  const avgOrderValue = paidOrders.length
    ? paidOrders.reduce((sum, o) => sum + (o.payment_amount ?? 0), 0) / paidOrders.length
    : 0;

  const byClient = new Map<string, number>();
  for (const order of orders) {
    byClient.set(order.customer_email, (byClient.get(order.customer_email) ?? 0) + 1);
  }

  const uniqueClients = byClient.size;
  const repeatClients = [...byClient.values()].filter((count) => count > 1).length;
  const repeatCustomerRate = uniqueClients > 0 ? repeatClients / uniqueClients : 0;

  let topClient: ClientKpis['topClient'] = null;
  let topEmail: string | null = null;
  let topCount = 0;
  for (const [email, count] of byClient) {
    if (count > topCount) {
      topCount = count;
      topEmail = email;
    }
  }
  if (topEmail) {
    const match = orders.find((o) => o.customer_email === topEmail);
    topClient = { name: match?.customer_name ?? topEmail, orderCount: topCount };
  }

  return { avgOrderValue, repeatCustomerRate, topClient };
}
