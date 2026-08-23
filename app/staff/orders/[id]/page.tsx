import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getUserById, getOrderById, getDesignRevisionsForOrder, getDesigners } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import DesignManager from '@/components/dashboard/DesignManager';
import ProofreaderPanel from '@/components/dashboard/ProofreaderPanel';
import AssignDesignerControl from '@/components/dashboard/AssignDesignerControl';
import UserLogoutButton from '@/components/ui/UserLogoutButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Design Review | Studio',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Dashboard', href: '/staff', exact: true }];

export default async function StaffOrderDesignsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=/staff/orders/${id}`);

  const user = await getUserById(session.user.id);
  if (!user || !['designer', 'employee', 'proofreader', 'admin'].includes(user.role)) {
    redirect('/account');
  }
  const isProofreader = user.role === 'proofreader';
  const canAssign = user.role === 'proofreader' || user.role === 'admin';

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  // A designer can only work on orders the proofreader has routed to them.
  if (user.role === 'designer' && order.assigned_designer_id !== user.id) {
    redirect('/staff');
  }

  const [revisions, designers] = await Promise.all([
    getDesignRevisionsForOrder(id),
    canAssign ? getDesigners() : Promise.resolve([]),
  ]);
  const apiBase = `/api/staff/orders/${order.id}/designs`;

  const assignedDesignerLabel = designers.find((d) => d.id === order.assigned_designer_id)?.name
    ?? designers.find((d) => d.id === order.assigned_designer_id)?.email
    ?? null;

  return (
    <DashboardShell
      theme="dark"
      section="Studio"
      navItems={NAV_ITEMS}
      userLabel={user.name ? `${user.name} · ${user.role}` : user.email}
      roleLabel={user.role}
      logoutSlot={<UserLogoutButton />}
    >
    <div className="dash-legacy">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
        Order #{order.id.slice(0, 8).toUpperCase()}
      </p>
      <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
        {order.service_type}
      </h1>

      {/* Full client / order details — the proofreader especially needs the whole picture, not just the design */}
      <div className="mt-6 grid grid-cols-1 gap-4 border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Customer</p>
          <p className="mt-1 font-body text-sm text-white/80">{order.customer_name}</p>
          <p className="font-mono text-[10px] text-white/40">{order.customer_email}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Order placed</p>
          <p className="mt-1 font-body text-sm text-white/80">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Event / delivery date</p>
          <p className="mt-1 font-body text-sm text-white/80">
            {order.event_date
              ? new Date(order.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : '—'}
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Estimated quantity</p>
          <p className="mt-1 font-body text-sm text-white/80">{order.quantity_estimate ?? '—'}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Order status</p>
          <p className="mt-1 font-body text-sm text-white/80 capitalize">{order.status.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Assigned designer</p>
          <div className="mt-1">
            {canAssign ? (
              <AssignDesignerControl orderId={order.id} currentDesignerId={order.assigned_designer_id} designers={designers} />
            ) : (
              <p className="font-body text-sm text-white/80">{assignedDesignerLabel ?? 'Unassigned'}</p>
            )}
          </div>
        </div>
      </div>

      {order.details && (
        <p className="mt-4 border-l-2 border-white/10 pl-4 font-body text-sm text-white/60">{order.details}</p>
      )}

      {order.portfolio_items && order.portfolio_items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {order.portfolio_items.map((item) => (
            <Link
              key={item.id}
              href={`/portfolio/${item.id}`}
              target="_blank"
              className="border border-white/15 px-3 py-1.5 font-mono text-[10px] text-white/70 transition-colors hover:border-[#C6A85C] hover:text-[#C6A85C]"
            >
              {item.title} <span className="text-white/30">· {item.category}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        {isProofreader ? (
          <ProofreaderPanel initialRevisions={revisions} apiBase={apiBase} />
        ) : (
          <DesignManager
            initialRevisions={revisions}
            apiBase={apiBase}
            viewerRole={user.role as 'designer' | 'employee' | 'admin'}
          />
        )}
      </div>
    </div>
    </DashboardShell>
  );
}
