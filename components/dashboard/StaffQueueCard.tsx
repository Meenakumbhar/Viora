import Link from 'next/link';
import Image from 'next/image';
import { accentForServiceType } from '@/lib/order-category';
import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import type { DesignRevision, Order } from '@/types/database';

// All but one entry are solid semantic colors — legible against both panel
// surfaces. Only "with customer" (a deliberately neutral, non-urgent tag)
// needs a theme-specific muted pair.
const STATUS_TAGS: Partial<Record<DesignRevision['status'] | 'no_proof', { label: string; className: string }>> = {
  returned_to_designer: { label: 'Returned to you', className: 'text-red-400 border-red-500/30 bg-red-500/10' },
  changes_requested: { label: 'Changes requested', className: 'text-red-400 border-red-500/30 bg-red-500/10' },
  pending_proofreader_review: { label: 'Needs your review', className: 'text-[#C6A85C] border-[#C6A85C]/40 bg-[#C6A85C]/10' },
  approved: { label: 'Approved', className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  no_proof: { label: 'New assignment', className: 'text-[#C6A85C] border-[#C6A85C]/40 bg-[#C6A85C]/10' },
};

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
}: {
  order: Order;
  latest?: DesignRevision;
  href: string;
  /** Shown when viewer sees orders beyond just their own (proofreader/admin) — who it's currently routed to, if anyone. */
  assignedToName?: string | null;
  theme: DashboardTheme;
}) {
  const p = PANEL_THEME[theme];
  const neutralTag = theme === 'dark' ? 'text-white/40 border-white/15' : 'text-text-muted border-border';
  const tag = latest ? (STATUS_TAGS[latest.status] ?? { label: 'With customer', className: neutralTag }) : STATUS_TAGS.no_proof;
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
          {tag && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${tag.className}`}>
              {tag.label}
            </span>
          )}
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
