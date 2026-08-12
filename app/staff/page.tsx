import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserById, getAllOrders, getDesignRevisionsForOrder, getDesigners } from '@/lib/db';
import { verifySessionToken, USER_SESSION_COOKIE } from '@/lib/user-session';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import StatCard from '@/components/dashboard/StatCard';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AssignDesignerControl from '@/components/dashboard/AssignDesignerControl';
import type { DesignRevisionStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Studio Dashboard',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Dashboard', href: '/staff', exact: true }];

const DESIGN_STATUS_LABELS: Record<DesignRevisionStatus, string> = {
  pending_proofreader_review: 'Awaiting proofreader',
  returned_to_designer: 'Returned by proofreader',
  pending_review: 'Awaiting customer',
  changes_requested: 'Changes requested',
  approved: 'Approved',
};

const DESIGN_STATUS_COLORS: Record<DesignRevisionStatus, string> = {
  pending_proofreader_review: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  returned_to_designer: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
  pending_review: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  changes_requested: 'border-red-500/30 bg-red-500/15 text-red-400',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
};

export default async function StaffDashboardPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(USER_SESSION_COOKIE)?.value);
  if (!session) redirect('/login?next=/staff');

  const user = await getUserById(session.userId);
  if (!user || !['designer', 'employee', 'proofreader', 'admin'].includes(user.role)) {
    redirect('/account');
  }
  const isProofreader = user.role === 'proofreader';
  const isDesigner = user.role === 'designer';
  const canAssign = user.role === 'proofreader' || user.role === 'admin';

  const [allOrders, designers] = await Promise.all([getAllOrders(), getDesigners()]);
  // A designer only ever sees orders the proofreader has routed to them.
  const orders = isDesigner ? allOrders.filter((o) => o.assigned_designer_id === user.id) : allOrders;

  const designerById = new Map(designers.map((d) => [d.id, d.name ?? d.email]));

  const revisionsByOrder = await Promise.all(orders.map((o) => getDesignRevisionsForOrder(o.id)));

  const rows = orders.map((order, i) => {
    const revisions = [...revisionsByOrder[i]].sort((a, b) => b.version - a.version);
    return { order, latest: revisions[0] };
  });

  const unassigned = rows.filter((r) => !r.order.assigned_designer_id).length;
  const needsProofreading = rows.filter((r) => r.latest?.status === 'pending_proofreader_review').length;
  const awaitingCustomer = rows.filter((r) => r.latest?.status === 'pending_review').length;
  const needsWork = rows.filter((r) => r.latest?.status === 'changes_requested').length;
  const noProofYet = rows.filter((r) => !r.latest).length;

  return (
    <DashboardShell
      theme="dark"
      section="Studio"
      navItems={NAV_ITEMS}
      userLabel={user.name ? `${user.name} · ${user.role}` : user.email}
      roleLabel={user.role}
      logoutSlot={<UserLogoutButton />}
    >
      <div className="mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Studio</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          {user.name ? `Hi, ${user.name}` : 'Dashboard'}
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          {isProofreader
            ? 'Route new orders to a designer, and review proofs before they reach the customer.'
            : isDesigner
              ? 'Orders routed to you by the proofreader.'
              : 'Design proofs awaiting upload, proofreading, or revision.'}
        </p>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {isProofreader ? (
          <StatCard label="Needs assignment" value={unassigned} theme="dark" accent={unassigned > 0 ? '#ef4444' : undefined} />
        ) : (
          <StatCard label="Needs a proof" value={noProofYet} theme="dark" />
        )}
        {isProofreader ? (
          <StatCard label="Needs your review" value={needsProofreading} theme="dark" />
        ) : (
          <StatCard label="Awaiting customer" value={awaitingCustomer} theme="dark" />
        )}
        <StatCard label="Changes requested" value={needsWork} accent="#ef4444" theme="dark" />
      </div>

      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Orders</h2>

      {rows.length === 0 ? (
        <div className="border border-white/10 p-10 text-center font-mono text-xs text-white/30">
          {isDesigner ? 'Nothing assigned to you yet.' : 'No orders yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Order</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Customer</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Service</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Design status</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Assigned to</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-white/40">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, latest }) => (
                <tr key={order.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-[10px] text-white/40">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-body text-sm text-white/80">{order.customer_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{order.service_type}</td>
                  <td className="px-4 py-3">
                    {latest ? (
                      <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${DESIGN_STATUS_COLORS[latest.status]}`}>
                        v{latest.version} · {DESIGN_STATUS_LABELS[latest.status]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/40">
                        No proof yet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canAssign ? (
                      <AssignDesignerControl orderId={order.id} currentDesignerId={order.assigned_designer_id} designers={designers} />
                    ) : order.assigned_designer_id ? (
                      <span className="font-mono text-[10px] text-white/60">{designerById.get(order.assigned_designer_id) ?? 'Unknown'}</span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/staff/orders/${order.id}`} className="font-mono text-[10px] uppercase tracking-wider text-[#C6A85C] hover:text-white">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
