'use client';

import { SWRConfig } from 'swr';
import { apiFetcher } from '@/lib/swr/fetcher';

/**
 * App-wide SWR defaults.
 *
 * Before this, every client component that needed data did its own
 * useEffect + fetch + useState, so the same endpoint was re-requested on
 * each mount and nothing was shared between components. The session lookup
 * in particular (/api/auth/me → a better-auth DB round-trip) ran on every
 * page load with no reuse at all.
 *
 * Defaults chosen for a dashboard people keep coming back to:
 *
 * - dedupingInterval: identical keys requested within this window collapse
 *   into one request, so several components can ask for the session without
 *   multiplying round-trips.
 * - revalidateOnFocus: returning to the tab refreshes the data. This is the
 *   behaviour that makes a dashboard feel live rather than stale.
 * - keepPreviousData: navigating between views renders the last good data
 *   while the new data loads, instead of flashing an empty state.
 * - errorRetryCount: bounded, so a genuinely failing endpoint doesn't retry
 *   forever in the background.
 */
export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        dedupingInterval: 30_000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        errorRetryCount: 2,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
