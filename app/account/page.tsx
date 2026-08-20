import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAccountOrders, isCompletedRow } from '@/lib/account-orders';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import OrdersView from '@/components/dashboard/OrdersView';

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
  const { user, rows: allRows } = await loadAccountOrders();
  // Completed jobs live on their own page (see the "Completed" link in the
  // left account nav) so this list never grows long with jobs the customer
  // no longer needs to act on.
  const rows = allRows.filter((row) => !isCompletedRow(row));

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
          {allRows.length === 0 ? (
            <>No orders yet — <Link href="/account/quote" className="text-accent-gold underline hover:text-accent-gold-dark">request a quote</Link> to get started.</>
          ) : (
            <>Nothing active right now — see <Link href="/account/completed" className="text-accent-gold underline hover:text-accent-gold-dark">Completed</Link> for past jobs.</>
          )}
        </p>
      ) : (
        <div className="mt-6">
          <OrdersView rows={rows} />
        </div>
      )}
    </AccountShell>
  );
}
