import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getUserById,
  getAllOrders,
  getDesignRevisionsForOrder,
  getDesigners,
  getRecentStaffActivity,
  getDesignerWorkload,
} from '@/lib/db';
import { auth } from '@/lib/auth';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import StaffDashboardContent from '@/components/dashboard/StaffDashboardContent';
import type { TurnaroundWeek } from '@/components/dashboard/TurnaroundSparkline';
import type { DesignRevision, Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Studio Dashboard',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Dashboard', href: '/staff', exact: true }];

const TURNAROUND_WEEKS = 8;

// Bucket every "resolved" revision (excludes ones still untouched at
// pending_proofreader_review) by the ISO week its status last changed,
// averaging days-to-resolve per week. updated_at only exists from this
// feature onward, so older weeks naturally thin out rather than being
// backfilled with guesses.
function computeTurnaround(revisions: DesignRevision[]): { weeks: TurnaroundWeek[]; currentAvg: number | null } {
  const resolved = revisions
    .filter((r) => r.status !== 'pending_proofreader_review')
    .map((r) => ({
      days: (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()) / 86400000,
      at: new Date(r.updated_at),
    }));

  const now = new Date();
  const weeks: TurnaroundWeek[] = [];
  for (let i = TURNAROUND_WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - i * 7 - 6);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const inWeek = resolved.filter((r) => r.at >= weekStart && r.at < weekEnd);
    weeks.push({
      label: weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      avgDays: inWeek.length > 0 ? inWeek.reduce((sum, r) => sum + r.days, 0) / inWeek.length : null,
    });
  }

  const currentAvg = resolved.length > 0 ? resolved.reduce((sum, r) => sum + r.days, 0) / resolved.length : null;
  return { weeks, currentAvg };
}

export default async function StaffDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login?next=/staff');

  const user = await getUserById(session.user.id);
  if (!user || !['designer', 'employee', 'proofreader', 'admin'].includes(user.role)) {
    redirect('/account');
  }
  const isProofreader = user.role === 'proofreader';
  const isDesigner = user.role === 'designer';
  const canAssign = user.role === 'proofreader' || user.role === 'admin';

  const [allOrders, designers, activity, workload] = await Promise.all([
    getAllOrders(),
    getDesigners(),
    getRecentStaffActivity({ designerId: isDesigner ? user.id : null, limit: 8 }),
    canAssign ? getDesignerWorkload() : Promise.resolve([]),
  ]);

  // A designer only ever sees orders the proofreader has routed to them.
  const orders = isDesigner ? allOrders.filter((o) => o.assigned_designer_id === user.id) : allOrders;

  // Plain object, not a Map — this crosses into a Client Component as a prop,
  // and Server → Client props must be JSON-serializable.
  const designerNamesById: Record<string, string> = Object.fromEntries(designers.map((d) => [d.id, d.name ?? d.email]));

  const revisionsByOrder = await Promise.all(orders.map((o) => getDesignRevisionsForOrder(o.id)));

  const rows = orders.map((order, i) => {
    const revisions = revisionsByOrder[i];
    const latest = [...revisions].sort((a, b) => b.version - a.version)[0];
    return { order, latest, revisions };
  });

  const unassigned = rows.filter((r) => !r.order.assigned_designer_id);
  const needsProofreading = rows.filter((r) => r.latest?.status === 'pending_proofreader_review').length;
  const awaitingCustomer = rows.filter((r) => r.latest?.status === 'pending_review').length;
  const needsWork = rows.filter((r) => r.latest?.status === 'changes_requested').length;
  const returnedToDesigner = rows.filter((r) => r.latest?.status === 'returned_to_designer').length;
  const approvedThisMonth = rows.filter((r) => {
    if (r.latest?.status !== 'approved') return false;
    const d = new Date(r.latest.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // "Needs my attention" — the thing this exact viewer would act on next —
  // sorted oldest-waiting-first within that group, everything else after.
  function needsAction(row: { order: Order; latest?: DesignRevision }): boolean {
    if (isDesigner) return row.latest?.status === 'returned_to_designer' || !row.latest;
    if (canAssign) return row.latest?.status === 'pending_proofreader_review' || row.latest?.status === 'changes_requested' || !row.latest;
    return false;
  }

  const queue = [...rows]
    .sort((a, b) => {
      const aUrgent = needsAction(a);
      const bUrgent = needsAction(b);
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
      const aSince = a.latest?.updated_at ?? a.order.created_at;
      const bSince = b.latest?.updated_at ?? b.order.created_at;
      return new Date(aSince).getTime() - new Date(bSince).getTime();
    })
    .map((row) => ({ ...row, actionable: needsAction(row) }));

  const allRevisionsInScope = revisionsByOrder.flat();
  const { weeks: turnaroundWeeks, currentAvg: turnaroundAvg } = computeTurnaround(allRevisionsInScope);

  return (
    <DashboardShell
      theme="dark"
      section="Studio"
      navItems={NAV_ITEMS}
      userLabel={user.name ? `${user.name} · ${user.role}` : user.email}
      roleLabel={user.role}
      logoutSlot={<UserLogoutButton />}
    >
      <StaffDashboardContent
        userName={user.name}
        role={user.role}
        isProofreader={isProofreader}
        isDesigner={isDesigner}
        canAssign={canAssign}
        unassignedOrders={unassigned.map((r) => r.order)}
        returnedToDesigner={returnedToDesigner}
        needsProofreading={needsProofreading}
        awaitingCustomer={awaitingCustomer}
        needsWork={needsWork}
        approvedThisMonth={approvedThisMonth}
        turnaroundAvg={turnaroundAvg}
        turnaroundWeeks={turnaroundWeeks}
        turnaroundWeekCount={TURNAROUND_WEEKS}
        designers={designers}
        queue={queue}
        designerNamesById={designerNamesById}
        activity={activity}
        workload={workload}
      />
    </DashboardShell>
  );
}
