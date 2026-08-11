import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserById, getOrdersByEmail, getOrderHistory } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import OrderStepper from '@/components/ui/OrderStepper';
import type { OrderStatus, OrderStatusHistoryEntry } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

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

  const orders = await getOrdersByEmail(user.email);
  const orderHistories = await Promise.all(orders.map((order) => getOrderHistory(order.id)));

  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide max-w-3xl py-32">
        {verified === '1' && (
          <div className="mb-8 max-w-md border border-accent-gold/40 bg-accent-gold/5 px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">Email verified</p>
            <p className="mt-1 font-body text-sm text-text-muted">Your account is now active.</p>
          </div>
        )}

        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Your account</span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading">
          {user.name ? `Hi, ${user.name}` : 'Welcome back'}
        </h1>

        <div className="mt-10 max-w-md border border-border p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Email</p>
          <p className="mt-1 font-body text-text-heading">{user.email}</p>

          <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-text-muted">Member since</p>
          <p className="mt-1 font-body text-text-heading">
            {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="mt-8 max-w-md">
          <UserLogoutButton />
        </div>

        {/* ── Order history ─────────────────────────────────────────── */}
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-display-md text-text-heading">Your orders</h2>

          {orders.length === 0 ? (
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
            <div className="mt-8 space-y-8">
              {orders.map((order, i) => {
                const history: OrderStatusHistoryEntry[] = orderHistories[i];
                return (
                  <div key={order.id} className="border border-border p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                          Order #{order.id.slice(0, 8).toUpperCase()} · Placed{' '}
                          {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <h3 className="mt-1 font-display text-xl text-text-heading">{order.service_type}</h3>
                      </div>
                      <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-accent-gold">
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    {order.portfolio_items && order.portfolio_items.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.portfolio_items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/portfolio/${item.id}`}
                            className="border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {order.details && (
                      <p className="mt-4 border-l-2 border-border pl-4 font-body text-sm text-text-muted">{order.details}</p>
                    )}

                    <div className="mt-8">
                      <OrderStepper status={order.status} theme="light" />
                    </div>

                    {history.length > 0 && (
                      <div className="mt-8 border-t border-border pt-6">
                        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">History</p>
                        <ul className="space-y-4 border-l border-border pl-5">
                          {[...history].reverse().map((entry) => (
                            <li key={entry.id} className="relative">
                              <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-accent-gold" aria-hidden="true" />
                              <p className="font-mono text-[10px] uppercase tracking-widest text-accent-gold">{STATUS_LABELS[entry.status]}</p>
                              <p className="font-mono text-[10px] text-text-muted">
                                {new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {entry.note && <p className="mt-1 font-body text-sm text-text-heading">{entry.note}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
