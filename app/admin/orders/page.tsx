import type { Metadata } from 'next';
import { getAllOrders, getAllUsers, syncOrderPricingFromCatalog } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import OrdersAdminManager from '@/components/admin/OrdersAdminManager';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orders | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const [rawOrders, users] = await Promise.all([getAllOrders(), getAllUsers()]);

  // One email->id map instead of a per-order account lookup — this page can
  // list every order at once. Keeps each price current with the pricing
  // catalog (negotiated price, or the price set on the specific piece it
  // references) instead of requiring a manual re-entry every time either
  // changes; no-ops for orders already paid.
  const userIdByEmail = new Map(users.map((u) => [u.email, u.id]));
  const orders = await Promise.all(
    rawOrders.map((order) => syncOrderPricingFromCatalog(order, userIdByEmail.get(order.customer_email) ?? null))
  );

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Orders</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Orders
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          Every order placed via a quote request, tracked through to completion. Status changes email the customer.
        </p>
      </div>

      <OrdersAdminManager initialOrders={orders} />
    </DashboardShell>
  );
}
