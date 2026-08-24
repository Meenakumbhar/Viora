'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { readSavedItems, unsaveItem, type SavedPortfolioItem } from '@/utils/portfolio-saved';
import { CATEGORY_LABELS } from '@/lib/order-category';
import type { ServiceCategory } from '@/types/database';

// Portfolio pieces a customer has hearted while browsing — saved to
// localStorage from the portfolio page, surfaced here too so the dashboard
// is a real hub rather than just an order tracker.
export default function SavedItemsPanel() {
  const [items, setItems] = useState<SavedPortfolioItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setItems(readSavedItems());
    sync();
    window.addEventListener('portfolio-saved-updated', sync);
    return () => window.removeEventListener('portfolio-saved-updated', sync);
  }, []);

  const groups = new Map<string, SavedPortfolioItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  return (
    <div>
      <p className="font-mono text-sm uppercase tracking-[0.18em] text-text-heading">Saved inspiration</p>
      <p className="mt-1.5 font-body text-sm text-text-muted">
        Portfolio pieces you&apos;ve hearted while browsing.
      </p>

      {/* Avoid a hydration mismatch — localStorage is empty on the server render. */}
      {mounted && items.length === 0 && (
        <div className="mt-6 border border-dashed border-border px-5 py-10 text-center">
          <p className="font-body text-sm text-text-muted">Nothing saved yet.</p>
          <Link href="/portfolio" className="mt-3 inline-block font-mono text-sm uppercase tracking-widest text-accent-gold link-underline">
            Browse the portfolio
          </Link>
        </div>
      )}

      {mounted && items.length > 0 && (
        <div className="mt-8 space-y-10">
          {Array.from(groups.entries()).map(([category, groupItems]) => (
            <div key={category}>
              <p className="font-mono text-sm uppercase tracking-widest text-text-muted">
                {CATEGORY_LABELS[category as ServiceCategory] ?? category} <span className="opacity-60">({groupItems.length})</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {groupItems.map((item) => (
                  <div key={item.id} className="group relative border border-border">
                    <Link href={`/portfolio/${item.id}`} className="block">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-surface">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(min-width: 768px) 25vw, 50vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-display text-3xl font-bold text-text-heading opacity-10">
                              {item.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 truncate px-1 pb-2 font-body text-sm text-text-heading">{item.title}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setItems(unsaveItem(item.id))}
                      aria-label={`Remove ${item.title} from saved`}
                      className="glass absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-text-heading opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
