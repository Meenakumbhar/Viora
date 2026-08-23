'use client';

import { useMemo, useState } from 'react';
import StaffQueueCard from './StaffQueueCard';
import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import type { DesignRevision, Order } from '@/types/database';

export interface QueueRow {
  order: Order;
  latest?: DesignRevision;
  /** Computed server-side (see needsAction in app/staff/page.tsx) — Server → Client props can't carry a function, only its result. */
  actionable: boolean;
}

type FilterKey = 'all' | 'action' | 'no_proof' | DesignRevision['status'];

const FILTER_LABELS: Record<Exclude<FilterKey, 'all' | 'action'>, string> = {
  no_proof: 'No proof yet',
  pending_proofreader_review: 'With proofreader',
  returned_to_designer: 'Returned to designer',
  pending_review: 'With customer',
  changes_requested: 'Changes requested',
  approved: 'Approved',
};

// Order they appear in as filter pills — roughly the order an order moves
// through, so the row reads left-to-right as a rough timeline.
const FILTER_ORDER: Exclude<FilterKey, 'all' | 'action'>[] = [
  'no_proof',
  'pending_proofreader_review',
  'returned_to_designer',
  'changes_requested',
  'pending_review',
  'approved',
];

function statusKey(row: QueueRow): Exclude<FilterKey, 'all' | 'action'> {
  return row.latest?.status ?? 'no_proof';
}

export default function StaffQueueList({
  rows,
  isDesigner,
  actionLabel,
  designerNamesById,
  emptyLabel,
  theme,
}: {
  /** Pre-sorted (urgency, then oldest-waiting) — filtering never re-sorts. */
  rows: QueueRow[];
  isDesigner: boolean;
  /** e.g. "Needs your review" (proofreader) or "Returned to you" (designer) — label for the quick "action" filter pill. Omit to hide that pill. */
  actionLabel?: string;
  /** Plain object, not a Map — Server → Client props must be serializable. */
  designerNamesById: Record<string, string>;
  emptyLabel: string;
  theme: DashboardTheme;
}) {
  const p = PANEL_THEME[theme];
  const [filter, setFilter] = useState<FilterKey>('all');

  const counts = useMemo(() => {
    const c: Partial<Record<FilterKey, number>> = { all: rows.length, action: rows.filter((r) => r.actionable).length };
    for (const row of rows) {
      const key = statusKey(row);
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    if (filter === 'action') return rows.filter((r) => r.actionable);
    return rows.filter((row) => statusKey(row) === filter);
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
          ? 'border-red-500/50 bg-red-500/15 text-red-400'
          : 'border-[#C6A85C] bg-[#C6A85C]/15 text-[#C6A85C]'
        : inactivePill
    }`;

  return (
    <div>
      <div className={`flex gap-2 overflow-x-auto border-b ${p.panelBorder} px-4 py-3`}>
        <button type="button" onClick={() => setFilter('all')} className={pillClass(filter === 'all')}>
          All <span className={countTextInactive}>· {counts.all ?? 0}</span>
        </button>
        {actionLabel && (counts.action ?? 0) > 0 && (
          <button type="button" onClick={() => setFilter('action')} className={pillClass(filter === 'action', true)}>
            {actionLabel} <span className={filter === 'action' ? 'text-red-400/70' : countTextInactive}>· {counts.action}</span>
          </button>
        )}
        {FILTER_ORDER.filter((key) => (counts[key] ?? 0) > 0).map((key) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className={pillClass(filter === key)}>
            {FILTER_LABELS[key]} <span className={countTextInactive}>· {counts[key]}</span>
          </button>
        ))}
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
