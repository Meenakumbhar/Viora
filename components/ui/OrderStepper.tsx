'use client';

import { STAGES, type DisplayStage } from '@/lib/order-stage';
import { formatDuration, formatDateTime } from '@/lib/format';

// Re-exported for existing callers' convenience — the derivation itself
// lives in lib/order-stage.ts (plain, server-safe) since server code like
// lib/account-orders.ts needs it too and shouldn't import a 'use client' file.
export { type DisplayStage, deriveDisplayStage, deriveStageSince } from '@/lib/order-stage';

const STAGE_LABELS: Record<DisplayStage, string> = {
  enquiry_received: 'Enquiry Received',
  order_confirmed: 'Order Confirmed',
  in_progress: 'In Progress',
  awaiting_review: 'Awaiting Your Review',
  payment: 'Payment',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrderStepper({
  stage,
  theme = 'dark',
  since,
}: {
  stage: DisplayStage;
  /** 'dark' matches the admin dashboard; 'light' matches the public site. */
  theme?: 'dark' | 'light';
  /** When the order entered its current stage — see deriveStageSince in lib/order-stage.ts. Shown as "X in this stage" under the current step; omitted entirely if not provided. */
  since?: string;
}) {
  // Not a step in the normal linear progression (see the type's own comment
  // in lib/order-stage.ts) — show a plain terminal marker instead of a
  // stepper with every step stuck at "unreached".
  if (stage === 'cancelled') {
    return (
      <div className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-text-muted'}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#7A4A44] text-[#7A4A44]" aria-hidden="true">
          ✕
        </span>
        Cancelled
      </div>
    );
  }

  const currentIndex = STAGES.indexOf(stage);
  const isDark = theme === 'dark';

  const mutedBorder = isDark ? 'border-white/20' : 'border-border';
  const mutedText = isDark ? 'text-white/30' : 'text-text-muted';
  const mutedLine = isDark ? 'bg-white/10' : 'bg-border';
  const reachedText = isDark ? 'text-[#0E1117]' : 'text-text-heading';

  return (
    <div>
      <div className="flex items-center overflow-x-auto">
      {STAGES.map((s, i) => {
        const reached = i <= currentIndex;
        // The current (not-yet-completed) step gets its own look — a solid
        // fill reads as "done", which "awaiting review" / "payment" aren't.
        const isCurrent = i === currentIndex && s !== 'completed';
        const isLast = i === STAGES.length - 1;
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs transition-colors ${
                  isCurrent
                    ? 'border-accent-gold bg-transparent text-accent-gold'
                    : reached
                      ? `border-accent-gold bg-accent-gold ${reachedText}`
                      : `${mutedBorder} ${mutedText}`
                }`}
                aria-hidden="true"
              >
                {reached && !isCurrent ? '✓' : i + 1}
              </div>
              <span
                className={`mt-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-widest ${
                  reached ? 'text-accent-gold' : mutedText
                }`}
              >
                {STAGE_LABELS[s]}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 mb-5 h-[2px] flex-1 ${i < currentIndex ? 'bg-accent-gold' : mutedLine}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
      </div>
      {since && (
        <p className={`mt-3 font-mono text-[11px] uppercase tracking-widest ${mutedText}`} title={formatDateTime(since)}>
          {stage === 'completed' ? 'Completed' : `${STAGE_LABELS[stage]} for`} {formatDuration(since)}
          {stage !== 'completed' && ' so far'}
        </p>
      )}
    </div>
  );
}
