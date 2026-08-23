import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderById, getDesignRevisionsForOrder } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import DesignManager from '@/components/dashboard/DesignManager';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Design Review | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminOrderDesignsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const revisions = await getDesignRevisionsForOrder(id);

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="dash-legacy">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        Order #{order.id.slice(0, 8).toUpperCase()} · {order.customer_name}
      </p>
      <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
        {order.service_type}
      </h1>
      <p className="mt-2 font-mono text-xs text-white/30">{order.customer_email}</p>
      </div>

      <div className="mt-10">
        <DesignManager initialRevisions={revisions} apiBase={`/api/admin/orders/${order.id}/designs`} />
      </div>
    </DashboardShell>
  );
}
