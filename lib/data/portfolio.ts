// ─── Portfolio ─────────────────────────────────────────────────────────
// Part of the lib/data boundary: this is the surface pages and route
// handlers import, instead of reaching into lib/db directly. Keeping the
// public surface domain-scoped (rather than one 2,000-line module) means
// the UI can be rewritten against a stable contract, and the queries behind
// it can later move out of lib/db without touching a single caller.
import 'server-only';

export {
  getPortfolioItems,
  getPortfolioItemById,
  getAllPortfolioItemsForAdmin,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from '@/lib/db';

export type {
  PortfolioItemInput,
} from '@/lib/db';

import { getPortfolioItems as queryPortfolioItems } from '@/lib/db';
import { ACTIVE_CATEGORIES } from '@/lib/active-services';
import type { PortfolioItem } from '@/types/database';

/**
 * Real studio work for the homepage strip — pulled live from the portfolio
 * so it always reflects what has actually been made, never seed data.
 *
 * Interleaved across the active categories rather than taken as one
 * recency-sorted pull, so the mix doesn't get swamped by whichever category
 * happens to have the most items.
 *
 * Lives here rather than in the page that renders it: the shaping rule is a
 * data concern, so it survives the page being rewritten.
 */
export async function getFeaturedPortfolioItems(limit = 3): Promise<PortfolioItem[]> {
  const perCategory = await Promise.all(
    ACTIVE_CATEGORIES.map((category) => queryPortfolioItems(category))
  );
  const maxLen = Math.max(0, ...perCategory.map((items) => items.length));

  const featured: PortfolioItem[] = [];
  for (let i = 0; i < maxLen && featured.length < limit; i++) {
    for (const items of perCategory) {
      const item = items[i];
      if (!item) continue;
      if (featured.length < limit) featured.push(item);
    }
  }

  return featured;
}
