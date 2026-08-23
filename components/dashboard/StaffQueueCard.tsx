import Link from 'next/link';
import Image from 'next/image';
import { accentForServiceType } from '@/lib/order-category';
import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import { bucketFor, bucketInfoForRole } from '@/lib/staff-workflow-labels';
import type { DesignRevision, Order } from '@/types/database';

function daysWaiting(since: string): string {
  const ms = Date.now() - new Date(since).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) return '<1d';
  return `${days}d`;
}

export default function StaffQueueCard({
  order,
  latest,
  href,
  assignedToName,
  theme,
  role,
}: {
  order: Order;
  latest?: DesignRevision;
  href: string;
  /** Shown when viewer sees orders beyond just their own (proofreader/admin) — who it's currently routed to, if anyone. */
  assignedToName?: string | null;
  theme: DashboardTheme;
  /** Same taxonomy the filter pills use (lib/staff-workflow-labels.ts) — so this tag is worded identically to whichever pill it belongs under. */
  role: string;
}) {
  const p = PANEL_THEME[theme];
  const tag = bucketInfoForRole(bucketFor(latest), role);
  const waitingSince = latest?.updated_at ?? order.created_at;
  const thumbSrc = latest?.image_urls?.[0];
  const accent = accentForServiceType(order.service_type);

  return (
    <Link href={href} className={`flex gap-3 border-b ${p.rowBorderSingle} px-4 py-3.5 transition-colors last:border-0 ${p.hoverRow}`}>
      <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded border ${p.thumbBorder}`}>
        {thumbSrc ? (
          <Image src={thumbSrc} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(150deg, ${accent}55, ${accent}15)` }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className={`truncate font-body text-[13px] ${p.heading}`}>{order.customer_name}</span>
          <span className={`shrink-0 font-mono text-[9.5px] ${p.faint}`}>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <p className={`mt-0.5 truncate font-mono text-[11px] ${p.muted}`}>
          {order.service_type}
          {latest && ` · v${latest.version}`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            title={tag.description}
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${tag.fill}`}
          >
            {tag.label}
          </span>
          {assignedToName !== undefined && (
            <span className={`font-mono text-[9.5px] uppercase tracking-wider ${p.faint}`}>
              {assignedToName ? `→ ${assignedToName}` : 'Unassigned'}
            </span>
          )}
        </div>
      </div>

      <div className={`shrink-0 text-right font-mono text-[10px] ${p.faint}`}>
        <span className="block text-[13px] font-medium text-amber-500">{daysWaiting(waitingSince)}</span>
        waiting
      </div>
    </Link>
  );
}
