'use client';

import type { OrderStatus } from '@/types/database';

const STAGES: OrderStatus[] = ['pending', 'in_progress', 'completed'];

const STAGE_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function OrderStepper({
  status,
  theme = 'dark',
}: {
  status: OrderStatus;
  /** 'dark' matches the admin dashboard; 'light' matches the public site. */
  theme?: 'dark' | 'light';
}) {
  const currentIndex = STAGES.indexOf(status);
  const isDark = theme === 'dark';

  const mutedBorder = isDark ? 'border-white/20' : 'border-border';
  const mutedText = isDark ? 'text-white/30' : 'text-text-muted';
  const mutedLine = isDark ? 'bg-white/10' : 'bg-border';
  const reachedText = isDark ? 'text-[#0E1117]' : 'text-text-heading';

  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const reached = i <= currentIndex;
        const isLast = i === STAGES.length - 1;
        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs transition-colors ${
                  reached ? `border-accent-gold bg-accent-gold ${reachedText}` : `${mutedBorder} ${mutedText}`
                }`}
                aria-hidden="true"
              >
                {reached ? '✓' : i + 1}
              </div>
              <span className={`mt-2 font-mono text-[9px] uppercase tracking-widest ${reached ? 'text-accent-gold' : mutedText}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 mb-5 h-[2px] flex-1 ${i < currentIndex ? 'bg-accent-gold' : mutedLine}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
