'use client';

import type { OrderStatus } from '@/types/database';

const STAGES: OrderStatus[] = ['pending', 'in_progress', 'completed'];

const STAGE_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function OrderStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STAGES.indexOf(status);

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
                  reached ? 'border-[#C6A85C] bg-[#C6A85C] text-[#0E1117]' : 'border-white/20 text-white/30'
                }`}
                aria-hidden="true"
              >
                {reached ? '✓' : i + 1}
              </div>
              <span className={`mt-2 font-mono text-[9px] uppercase tracking-widest ${reached ? 'text-[#C6A85C]' : 'text-white/30'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 mb-5 h-[2px] flex-1 ${i < currentIndex ? 'bg-[#C6A85C]' : 'bg-white/10'}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
