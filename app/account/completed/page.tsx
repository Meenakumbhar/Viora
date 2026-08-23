import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAccountOrders, isCompletedRow } from '@/lib/account-orders';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import CustomerOrderList from '@/components/dashboard/CustomerOrderList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Completed orders',
  robots: { index: false, follow: false },
};

export default async function CompletedOrdersPage() {
  const { user, rows: allRows } = await loadAccountOrders();
  const rows = allRows.filter(isCompletedRow);

  return (
    <AccountShell
      userName={user.name ? user.name : 'Welcome back'}
      memberSince={new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      logoutSlot={<UserLogoutButton />}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-base uppercase tracking-[0.18em] text-text-heading">Completed</p>
          <p className="mt-1.5 font-body text-base text-text-muted">
            Jobs that have finished production and shipped.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 border border-dashed border-border px-5 py-8 text-center font-body text-body-base text-text-muted">
          Nothing here yet — completed jobs will show up once a job&apos;s finished. See{' '}
          <Link href="/account" className="text-accent-gold underline hover:text-accent-gold-dark">Orders</Link> for what&apos;s active.
        </p>
      ) : (
        <div className="mt-6">
          <CustomerOrderList rows={rows} />
        </div>
      )}
    </AccountShell>
  );
}
