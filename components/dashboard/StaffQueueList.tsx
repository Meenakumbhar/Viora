'use client';

import { useMemo, useState } from 'react';
import StaffQueueCard from './StaffQueueCard';
import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import { bucketFor, bucketInfoForRole, filterBucketsForRole, type WorkflowBucket } from '@/lib/staff-workflow-labels';
import type { DesignRevision, Order } from '@/types/database';

export interface QueueRow {
  order: Order;
  latest?: DesignRevision;
  /** Computed server-side (see needsAction in app/staff/page.tsx) — Server → Client props can't carry a function, only its result. */
  actionable: boolean;
}

type FilterKey = 'all' | 'action' | WorkflowBucket;

export default function StaffQueueList({
  rows,
  isDesigner,
  role,
  actionLabel,
  designerNamesById,
  emptyLabel,
  theme,
}: {
  /** Pre-sorted (urgency, then oldest-waiting) — filtering never re-sorts. */
  rows: QueueRow[];
  isDesigner: boolean;
  /** Decides which filter pills are offered — see filterBucketsForRole in lib/staff-workflow-labels.ts. */
  role: string;
  /** e.g. "Needs your review" (proofreader) or "Returned to you" (designer) — label for the quick "action" filter pill. Omit to hide that pill. */
  actionLabel?: string;
  /** Plain object, not a Map — Server → Client props must be serializable. */
  designerNamesById: Record<string, string>;
  emptyLabel: string;
  theme: DashboardTheme;
}) {
  const p = PANEL_THEME[theme];
  const [filter, setFilter] = useState<FilterKey>('all');
  const filterBuckets = filterBucketsForRole(role);

  const counts = useMemo(() => {
    const c: Partial<Record<FilterKey, number>> = { all: rows.length, action: rows.filter((r) => r.actionable).length };
    for (const row of rows) {
      const key = bucketFor(row.latest);
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'action') return rows.filter((r) => r.actionable);
    return rows.filter((row) => bucketFor(row.latest) === filter);
  }, [rows, filter]);

  const inactivePill =
    theme === 'dark'
      ? 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
      : 'border-border text-text-muted hover:border-text-muted hover:text-text-heading';
  const countTextInactive = theme === 'dark' ? 'text-white/30' : 'text-text-muted/70';

  const pillClass = (active: boolean, urgent = false) =>
    `shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
      active
        ? urgent
          ? 'border-red-500/50 bg-red-500 text-white'
          : 'border-[#C6A85C] bg-[#C6A85C] text-[#0E1117]'
        : inactivePill
    }`;

  return (
    <div>
      <div className={`flex gap-2 overflow-x-auto border-b ${p.panelBorder} px-4 py-3`}>
        <button type="button" onClick={() => setFilter('all')} className={pillClass(filter === 'all')}>
          All <span className={filter === 'all' ? 'opacity-70' : countTextInactive}>· {counts.all ?? 0}</span>
        </button>
        {actionLabel && (counts.action ?? 0) > 0 && (
          <button type="button" onClick={() => setFilter('action')} className={pillClass(filter === 'action', true)}>
            {actionLabel} <span className={filter === 'action' ? 'text-white/80' : countTextInactive}>· {counts.action}</span>
          </button>
        )}
        {filterBuckets
          .filter((key) => (counts[key] ?? 0) > 0)
          .map((key) => {
            const info = bucketInfoForRole(key, role);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                title={info.description}
                className={pillClass(filter === key)}
              >
                {info.label} <span className={filter === key ? 'opacity-70' : countTextInactive}>· {counts[key]}</span>
              </button>
            );
          })}
      </div>

      {filtered.length === 0 ? (
        <div className={`px-4 py-10 text-center font-mono text-xs ${p.faint}`}>
          {filter === 'all' ? emptyLabel : 'Nothing in this filter right now.'}
        </div>
      ) : (
        <div>
          {filtered.map(({ order, latest }) => (
            <StaffQueueCard
              key={order.id}
              order={order}
              latest={latest}
              href={`/staff/orders/${order.id}`}
              theme={theme}
              role={role}
              assignedToName={
                isDesigner ? undefined : order.assigned_designer_id ? (designerNamesById[order.assigned_designer_id] ?? 'Unknown') : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
