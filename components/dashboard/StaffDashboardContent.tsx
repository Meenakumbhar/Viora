'use client';

import StatCard from '@/components/dashboard/StatCard';
import AssignDesignerControl from '@/components/dashboard/AssignDesignerControl';
import StaffQueueList, { type QueueRow } from '@/components/dashboard/StaffQueueList';
import StaffActivityFeed from '@/components/dashboard/StaffActivityFeed';
import DesignerWorkloadPanel from '@/components/dashboard/DesignerWorkloadPanel';
import TurnaroundSparkline, { type TurnaroundWeek } from '@/components/dashboard/TurnaroundSparkline';
import { useDashboardTheme, PANEL_THEME } from '@/lib/dashboard-theme';
import type { DesignerWorkload } from '@/lib/db';
import type { Order, StaffActivityEvent } from '@/types/database';

interface Designer {
  id: string;
  name: string | null;
  email: string;
}

export interface StaffDashboardContentProps {
  userName: string | null;
  role: string;
  isProofreader: boolean;
  isDesigner: boolean;
  canAssign: boolean;
  unassignedOrders: Order[];
  returnedToDesigner: number;
  needsProofreading: number;
  awaitingCustomer: number;
  needsWork: number;
  approvedThisMonth: number;
  turnaroundAvg: number | null;
  turnaroundWeeks: TurnaroundWeek[];
  turnaroundWeekCount: number;
  designers: Designer[];
  queue: QueueRow[];
  designerNamesById: Record<string, string>;
  activity: StaffActivityEvent[];
  workload: DesignerWorkload[];
}

export default function StaffDashboardContent({
  userName,
  isProofreader,
  isDesigner,
  role,
  canAssign,
  unassignedOrders,
  returnedToDesigner,
  needsProofreading,
  awaitingCustomer,
  needsWork,
  approvedThisMonth,
  turnaroundAvg,
  turnaroundWeeks,
  turnaroundWeekCount,
  designers,
  queue,
  designerNamesById,
  activity,
  workload,
}: StaffDashboardContentProps) {
  const theme = useDashboardTheme();
  const p = PANEL_THEME[theme];

  return (
    <>
      <div className="mb-8">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Studio</span>
        <h1 className={`mt-2 font-display text-4xl font-light ${p.heading}`} style={{ letterSpacing: '-0.02em' }}>
          {userName ? `Hi, ${userName}` : 'Dashboard'}
        </h1>
        <p className={`mt-2 font-mono text-xs ${p.faint}`}>
          {isProofreader
            ? 'Route new orders to a designer, and review proofs before they reach the customer.'
            : isDesigner
              ? 'Orders routed to you by the proofreader, oldest waiting first.'
              : 'Design proofs awaiting upload, proofreading, or revision.'}
        </p>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isProofreader || role === 'admin' ? (
          <StatCard label="Needs assignment" value={unassignedOrders.length} theme={theme} accent={unassignedOrders.length > 0 ? '#ef4444' : undefined} />
        ) : (
          <StatCard label="Returned to you" value={returnedToDesigner} theme={theme} accent={returnedToDesigner > 0 ? '#ef4444' : undefined} />
        )}
        {isProofreader || role === 'admin' ? (
          <StatCard label="Needs your review" value={needsProofreading} theme={theme} />
        ) : (
          <StatCard label="Awaiting customer" value={awaitingCustomer} theme={theme} />
        )}
        <StatCard label="Avg turnaround" value={turnaroundAvg !== null ? `${turnaroundAvg.toFixed(1)}d` : '—'} theme={theme} />
        {isDesigner ? (
          <StatCard label="Approved this month" value={approvedThisMonth} theme={theme} />
        ) : (
          <StatCard label="Changes requested" value={needsWork} accent="#ef4444" theme={theme} />
        )}
      </div>

      {/* Needs assignment — proofreader/admin only, only when there's something to route */}
      {canAssign && unassignedOrders.length > 0 && (
        <div className="mb-8 border border-[#C6A85C]/25 bg-[#C6A85C]/[0.04]">
          <div className="border-b border-[#C6A85C]/20 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#C6A85C]">Needs assignment</p>
          </div>
          <ul className={`divide-y ${p.rowBorder}`}>
            {unassignedOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <span className={`font-body text-sm ${p.heading}`}>{order.customer_name}</span>
                  <span className={`ml-2 font-mono text-[11px] ${p.muted}`}>{order.service_type}</span>
                </div>
                <AssignDesignerControl orderId={order.id} currentDesignerId={order.assigned_designer_id} designers={designers} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Body: queue + activity/turnaround sidebar */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className={`border ${p.panelBorder} ${p.surface}`}>
          <div className="flex items-center justify-between px-4 pt-3">
            <p className={`font-mono text-[10px] uppercase tracking-widest ${p.muted}`}>{isDesigner ? 'My queue' : 'All orders'}</p>
            <span className={`font-mono text-[10px] ${p.faint}`}>{queue.length}</span>
          </div>
          <StaffQueueList
            rows={queue}
            isDesigner={isDesigner}
            role={role}
            actionLabel={isDesigner ? 'Returned to you' : 'Needs your review'}
            designerNamesById={designerNamesById}
            emptyLabel={isDesigner ? 'Nothing assigned to you yet.' : 'No orders yet.'}
            theme={theme}
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className={`border ${p.panelBorder} ${p.surface}`}>
            <div className={`border-b ${p.panelBorder} px-4 py-3`}>
              <p className={`font-mono text-[10px] uppercase tracking-widest ${p.muted}`}>Activity</p>
            </div>
            <StaffActivityFeed events={activity} theme={theme} />
          </div>

          <div className={`border ${p.panelBorder} ${p.surface}`}>
            <div className={`border-b ${p.panelBorder} px-4 py-3`}>
              <p className={`font-mono text-[10px] uppercase tracking-widest ${p.muted}`}>Turnaround, last {turnaroundWeekCount} weeks</p>
            </div>
            <TurnaroundSparkline weeks={turnaroundWeeks} currentAvg={turnaroundAvg} theme={theme} />
          </div>
        </div>
      </div>

      {/* Team workload — proofreader/admin only */}
      {canAssign && workload.length > 0 && (
        <div className={`mt-8 border ${p.panelBorder} ${p.surface}`}>
          <div className={`border-b ${p.panelBorder} px-4 py-3`}>
            <p className={`font-mono text-[10px] uppercase tracking-widest ${p.muted}`}>Team workload</p>
          </div>
          <DesignerWorkloadPanel workload={workload} theme={theme} />
        </div>
      )}
    </>
  );
}
