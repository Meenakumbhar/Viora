import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import {
  getUserById,
  getOrdersByEmail,
  getOrderHistoriesForOrders,
  getDesignRevisionsForOrders,
  getEnquiriesByEmail,
  syncOrderPricingFromCatalog,
} from '@/lib/db';
import type { AccountRow } from '@/components/dashboard/CustomerOrderList';
import type { User } from '@/types/database';

// Shared by every /account/* page that needs "this customer's jobs" —
// the orders + placed-quote rows, newest first. Kept in one place so the
// Orders page and the Completed page can't drift on how a row is built.
export async function loadAccountOrders(): Promise<{ user: User; rows: AccountRow[] }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const user = await getUserById(session.user.id);
  if (!user) redirect('/login');

  const [rawOrders, enquiries] = await Promise.all([
    getOrdersByEmail(user.email, user.id),
    getEnquiriesByEmail(user.email, user.id),
  ]);

  // Keeps each order's price current with the pricing catalog (negotiated
  // price, or the price set on the specific piece it references) instead of
  // showing a stale figure someone would otherwise have to re-enter by hand
  // every time either changes. No-ops for orders already paid.
  const orders = await Promise.all(rawOrders.map((order) => syncOrderPricingFromCatalog(order, user.id)));

  const orderIds = orders.map((o) => o.id);
  const [historyMap, revisionMap] = await Promise.all([
    getOrderHistoriesForOrders(orderIds),
    getDesignRevisionsForOrders(orderIds),
  ]);

  const orderRows: AccountRow[] = orders.map((order) => ({
    kind: 'order',
    id: order.id,
    order,
    history: historyMap.get(order.id) ?? [],
    latestRevision: [...(revisionMap.get(order.id) ?? [])].sort((a, b) => b.version - a.version)[0],
  }));

  // A quote only shows as its own "Placed" row until an admin turns it into
  // an order — once that happens it's represented by the order row above,
  // not duplicated here.
  const convertedEnquiryIds = new Set(orders.filter((o) => o.enquiry_id).map((o) => o.enquiry_id as string));
  const placedRows: AccountRow[] = enquiries
    .filter((enquiry) => !convertedEnquiryIds.has(enquiry.id))
    .map((enquiry) => ({ kind: 'placed', id: enquiry.id, enquiry }));

  const rows: AccountRow[] = [...orderRows, ...placedRows].sort((a, b) => {
    const aDate = a.kind === 'order' ? a.order.created_at : a.enquiry.created_at;
    const bDate = b.kind === 'order' ? b.order.created_at : b.enquiry.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return { user, rows };
}

export function isCompletedRow(row: AccountRow): boolean {
  return row.kind === 'order' && row.order.status === 'completed';
}
