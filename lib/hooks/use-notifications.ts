'use client';

import useSWR from 'swr';

export interface AwaitingReviewItem {
  id: string;
  serviceType: string;
}

interface NotificationsResponse {
  awaitingReviewCount: number;
  awaitingReview: AwaitingReviewItem[];
}

/**
 * Design proofs waiting on the signed-in customer.
 *
 * Shared chrome renders this on every /account/* page, so without a cache it
 * re-requested on each navigation — and the endpoint behind it fans out to
 * the customer's orders and their design revisions. Through SWR the answer
 * is reused across mounts and refreshed when the tab regains focus, which is
 * exactly when a stale count would be noticed.
 *
 * A 401 here just means signed out, so failures degrade to an empty list
 * rather than surfacing an error in the chrome.
 */
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    '/api/account/notifications'
  );

  return {
    items: data?.awaitingReview ?? [],
    count: data?.awaitingReviewCount ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}
