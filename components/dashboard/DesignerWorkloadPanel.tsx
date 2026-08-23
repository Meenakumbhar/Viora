import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import type { DesignerWorkload } from '@/lib/db';

export default function DesignerWorkloadPanel({ workload, theme }: { workload: DesignerWorkload[]; theme: DashboardTheme }) {
  const p = PANEL_THEME[theme];
  const trackBg = theme === 'dark' ? 'bg-white/5' : 'bg-black/5';

  if (workload.length === 0) {
    return (
      <div className={`px-4 py-8 text-center font-mono text-xs ${p.faint}`}>
        No designers on the team yet.
      </div>
    );
  }

  const max = Math.max(1, ...workload.map((w) => w.openOrders));

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {[...workload].sort((a, b) => b.openOrders - a.openOrders).map((w) => (
        <div key={w.designerId} className="flex items-center gap-3">
          <span className={`w-20 shrink-0 truncate font-body text-[12px] ${p.text}`} title={w.name}>
            {w.name}
          </span>
          <div className={`h-1.5 flex-1 overflow-hidden rounded ${trackBg}`}>
            <div
              className={`h-full rounded ${w.openOrders === 0 ? 'bg-emerald-400/70' : 'bg-[#C6A85C]'}`}
              style={{ width: `${(w.openOrders / max) * 100}%` }}
            />
          </div>
          <span className={`w-5 shrink-0 text-right font-mono text-[11px] ${p.muted}`}>{w.openOrders}</span>
        </div>
      ))}
    </div>
  );
}
