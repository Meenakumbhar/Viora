'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Self-fetching — reads its own count from /api/account/notifications rather
// than taking it as a prop, so it can sit in shared chrome (JobTicket) used
// across every /account/* page without each page having to fetch and thread
// it through. Only ever shows when there's something to show — no "0" badge.
export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/notifications')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((json) => {
        if (!cancelled && json.success) setCount(json.data.awaitingReviewCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/account"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-accent-gold/40 bg-accent-gold/5 text-accent-gold transition-colors hover:bg-accent-gold/15"
      aria-label={`${count} design proof${count > 1 ? 's' : ''} awaiting your review`}
      title={`${count} design proof${count > 1 ? 's' : ''} awaiting your review`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[9px] font-bold leading-none text-white">
        {count > 9 ? '9+' : count}
      </span>
    </Link>
  );
}
