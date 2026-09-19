'use client';

import useSWR from 'swr';
import type { PublicUser } from '@/types/database';

type MeResponse = { user: PublicUser } | null;

/**
 * The current logged-in user, or null when signed out.
 *
 * Shared through SWR so the several components that care about the session
 * (Nav, notification bell, account panels) resolve to one request rather
 * than one each — /api/auth/me costs a better-auth session lookup against
 * Postgres every time it is actually hit.
 *
 * `isLoading` is distinct from "signed out": on first paint the answer is
 * not known yet, and treating that as signed-out makes the nav flicker.
 */
export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<MeResponse>('/api/auth/me');

  return {
    user: data?.user ?? null,
    isLoading,
    isLoggedIn: Boolean(data?.user),
    error,
    /** Call after login/logout so every consumer updates at once. */
    refresh: mutate,
  };
}
