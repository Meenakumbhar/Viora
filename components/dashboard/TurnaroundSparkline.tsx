import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';

export interface TurnaroundWeek {
  label: string;
  avgDays: number | null;
}

// A hand-rolled inline SVG, matching the existing admin charts
// (components used on /admin's AnalyticsSidebar) rather than pulling in a
// charting library for one sparkline.
export default function TurnaroundSparkline({
  weeks,
  currentAvg,
  theme,
}: {
  weeks: TurnaroundWeek[];
  currentAvg: number | null;
  theme: DashboardTheme;
}) {
  const p = PANEL_THEME[theme];
  const values = weeks.map((w) => w.avgDays).filter((v): v is number => v !== null);

  if (values.length < 2) {
    return (
      <div className={`px-4 py-6 text-center font-mono text-xs ${p.faint}`}>
        Not enough resolved proofs yet to chart a trend.
      </div>
    );
  }

  const max = Math.max(...values, 0.5);
  const w = 240;
  const h = 56;
  const stepX = w / (weeks.length - 1);

  const points = weeks.map((week, i) => {
    const x = i * stepX;
    const y = week.avgDays === null ? h : h - (week.avgDays / max) * (h - 6) - 3;
    return `${x},${y}`;
  });

  const linePoints = points.join(' ');
  const fillPoints = `0,${h} ${linePoints} ${w},${h}`;

  return (
    <div className="px-4 py-4">
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className={`font-display text-[26px] font-light leading-none ${p.heading}`}>
          {currentAvg !== null ? currentAvg.toFixed(1) : '—'}
          <span className={`ml-0.5 text-[13px] ${p.faint}`}>d</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label="Average turnaround over recent weeks">
        <polyline points={fillPoints} fill="url(#tsGrad)" stroke="none" opacity="0.5" />
        <polyline points={linePoints} fill="none" stroke="#C6A85C" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <defs>
          <linearGradient id="tsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C6A85C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C6A85C" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
