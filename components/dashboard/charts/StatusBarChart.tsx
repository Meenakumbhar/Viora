'use client';

import type { StatusBreakdownPoint } from '@/lib/analytics';
import type { OrderStatus } from '@/types/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// Validated categorical set (dataviz skill, dark-mode slots 1–3), passes CVD +
// contrast checks against this dashboard's #0E1117 surface.
const STATUS_COLORS: Record<OrderStatus, string> = {
  in_progress: '#3987e5',
  pending: '#d95926',
  completed: '#199e70',
};

export default function StatusBarChart({ data }: { data: StatusBreakdownPoint[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.status}>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/50">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.status] }} />
              {STATUS_LABELS[d.status]}
            </span>
            <span className="font-mono text-[10px] text-white/70">{d.count}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: STATUS_COLORS[d.status] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
