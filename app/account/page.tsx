import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserById, getOrdersByEmail, getOrderHistory, getDesignRevisionsForCustomer, getEnquiriesByEmail } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import StatCard from '@/components/dashboard/StatCard';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import CustomerOrderList, { type AccountRow } from '@/components/dashboard/CustomerOrderList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Overview', href: '/account', exact: true }];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(USER_SESSION_COOKIE)?.value);

  if (!session) {
    redirect('/login');
  }

  const user = await getUserById(session.userId);

  if (!user) {
    redirect('/login');
  }

  const [orders, enquiries] = await Promise.all([
    getOrdersByEmail(user.email),
    getEnquiriesByEmail(user.email),
  ]);
  const orderHistories = await Promise.all(orders.map((order) => getOrderHistory(order.id)));
  const orderRevisions = await Promise.all(orders.map((order) => getDesignRevisionsForCustomer(order.id)));

  const orderRows: AccountRow[] = orders.map((order, i) => ({
    kind: 'order',
    id: order.id,
    order,
    history: orderHistories[i],
    latestRevision: [...orderRevisions[i]].sort((a, b) => b.version - a.version)[0],
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

  const inProgress = orders.filter((o) => o.status === 'in_progress').length;
  const awaitingReview = orderRows.filter((r) => r.kind === 'order' && r.latestRevision?.status === 'pending_review').length;

  return (
    <DashboardShell
      theme="light"
      section="Account"
      navItems={NAV_ITEMS}
      userLabel={user.name ?? user.email}
      logoutSlot={<UserLogoutButton />}
    >
      {verified === '1' && (
        <div className="mb-8 max-w-md border border-accent-gold/40 bg-accent-gold/5 px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">Email verified</p>
          <p className="mt-1 font-body text-sm text-text-muted">Your account is now active.</p>
        </div>
      )}

      <div className="mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">Overview</span>
        <h1 className="mt-2 font-display text-4xl font-light text-text-heading" style={{ letterSpacing: '-0.02em' }}>
          {user.name ? `Hi, ${user.name}` : 'Welcome back'}
        </h1>
      </div>

      {orders.length > 0 && (
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total orders" value={orders.length} theme="light" />
          <StatCard label="In progress" value={inProgress} theme="light" />
          <StatCard label="Awaiting your review" value={awaitingReview} theme="light" accent={awaitingReview > 0 ? '#C6A85C' : undefined} />
        </div>
      )}

      <div className="mb-12 max-w-md border border-border p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Email</p>
        <p className="mt-1 font-body text-text-heading">{user.email}</p>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-text-muted">Member since</p>
        <p className="mt-1 font-body text-text-heading">
          {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Order history ─────────────────────────────────────────── */}
      <div className="border-t border-border pt-10">
        <h2 className="font-display text-2xl font-light text-text-heading">Your orders</h2>
        <p className="mt-1 font-body text-sm text-text-muted">
          Every quote you&apos;ve placed, from first request through to completion.
        </p>

        {rows.length === 0 ? (
          <p className="mt-4 font-body text-body-base text-text-muted">
            No orders yet.{' '}
            <Link href="/portfolio" className="text-accent-gold link-underline">
              Browse the portfolio
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-accent-gold link-underline">
              request a quote
            </Link>{' '}
            to get started.
          </p>
        ) : (
          <CustomerOrderList rows={rows} />
        )}
      </div>
    </DashboardShell>
  );
}
