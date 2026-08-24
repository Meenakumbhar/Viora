'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface AwaitingReviewItem {
  id: string;
  serviceType: string;
}

// Self-fetching — reads its own data from /api/account/notifications rather
// than taking it as a prop, so it can sit in shared chrome (JobTicket) used
// across every /account/* page without each page having to fetch and thread
// it through. Only ever shows when there's something to show — no "0" badge.
//
// Click-to-open panel, not just a hover title: a native title tooltip is
// slow to appear, easy to dismiss by accident, and gives no way to act on
// what it says — the previous version only had that, so the badge existed
// but nobody could tell what it was for without guessing.
export default function NotificationBell() {
  const [items, setItems] = useState<AwaitingReviewItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/notifications')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((json) => {
        if (!cancelled && json.success) setItems(json.data.awaitingReview ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const count = items.length;
  if (count === 0) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-accent-gold/40 bg-accent-gold/5 text-accent-gold transition-colors hover:bg-accent-gold/15"
        aria-label={`${count} design proof${count > 1 ? 's' : ''} awaiting your review`}
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
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 font-mono text-sm font-bold leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 border border-border bg-bg-primary shadow-[0_18px_40px_rgba(24,31,39,0.18)]"
        >
          <p className="border-b border-border px-4 py-3 font-mono text-sm uppercase tracking-wider text-text-muted">
            Awaiting your review
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border/60 last:border-b-0">
                <Link
                  href={`/account/orders/${item.id}/review`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 transition-colors hover:bg-bg-secondary"
                >
                  <span className="block font-body text-sm text-text-heading">{item.serviceType}</span>
                  <span className="block font-mono text-xs text-text-muted">
                    Order #{item.id.slice(0, 8).toUpperCase()} — a new proof is ready to review
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
