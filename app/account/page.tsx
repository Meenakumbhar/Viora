import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getUserById,
  getOrdersByEmail,
  getOrderHistoriesForOrders,
  getDesignRevisionsForOrders,
  getEnquiriesByEmail,
  syncOrderPricingFromCatalog,
} from '@/lib/db';
import { auth } from '@/lib/auth';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import OrdersView from '@/components/dashboard/OrdersView';
import type { AccountRow } from '@/components/dashboard/CustomerOrderList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your orders',
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    redirect('/login');
  }

  const [rawOrders, enquiries] = await Promise.all([
    getOrdersByEmail(user.email),
    getEnquiriesByEmail(user.email),
  ]);

  // Keeps each order's price current with the pricing catalog (negotiated
  // price, or the price set on the specific piece it references) instead of
  // showing a stale figure someone would otherwise have to re-enter by hand
  // every time either changes. No-ops for orders already paid.
  const orders = await Promise.all(rawOrders.map((order) => syncOrderPricingFromCatalog(order, user.id)));

  const orderIds = orders.map((o) => o.id);
  // Two batched queries covering every order at once, instead of one
  // getOrderHistory + one getDesignRevisionsForCustomer call per order.
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

  return (
    <AccountShell
      userName={user.name ? user.name : 'Welcome back'}
      memberSince={new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      logoutSlot={<UserLogoutButton />}
    >
      {verified === '1' && (
        <div className="mb-6 border border-accent-gold/40 bg-accent-gold/5 px-5 py-4">
          <p className="font-mono text-sm uppercase tracking-widest text-accent-gold">Email verified</p>
          <p className="mt-1 font-body text-base text-text-muted">Your account is now active.</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-heading">Your jobs</p>
          <p className="mt-1.5 font-body text-base text-text-muted">
            Every quote you&apos;ve placed, from first request through to completion.
          </p>
        </div>
        <Link
          href="/account/quote"
          className="shrink-0 border border-accent-gold px-5 py-2.5 font-mono text-sm uppercase tracking-widest text-accent-gold transition-colors hover:bg-accent-gold hover:text-bg-primary"
        >
          New quote
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 border border-dashed border-border px-5 py-8 text-center font-body text-body-base text-text-muted">
          No orders yet — <Link href="/account/quote" className="text-accent-gold underline hover:text-accent-gold-dark">request a quote</Link> to get started.
        </p>
      ) : (
        <div className="mt-6">
          <OrdersView rows={rows} />
        </div>
      )}
    </AccountShell>
  );
}
