import type { Metadata } from 'next';

// Every route in this group is per-user and behind an auth check in proxy.ts,
// so there is nothing worth caching or prerendering.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/* ═══════════════════════════════════════════════════════════════════════════
   APP LAYOUT — admin + staff dashboards
   ─────────────────────────────────────────────────────────────────────────
   Intentionally bare. These pages bring their own chrome via DashboardShell,
   and this group exists precisely so the marketing Nav/Footer are never
   rendered (or queried for) here.

   Note this is a nested layout, not a second root layout — app/layout.tsx
   still supplies <html>/<body>. Two root layouts would force a full page
   reload when moving between the marketing site and a dashboard.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
