'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DashboardNavItem {
  label: string;
  href: string;
  /** Exact match only — otherwise any nested route (e.g. /admin/orders/[id]) also matches /admin */
  exact?: boolean;
}

interface DashboardShellProps {
  theme: 'dark' | 'light';
  /** Small eyebrow above the wordmark, e.g. "Admin" or "Studio" */
  section: string;
  navItems: DashboardNavItem[];
  userLabel: string;
  roleLabel?: string;
  logoutSlot: React.ReactNode;
  children: React.ReactNode;
  /** Optional collapsible right panel — e.g. analytics charts. Hidden by default, toggled from the topbar. */
  analyticsSlot?: React.ReactNode;
}

// A small registration-mark cross — the print industry's own alignment mark —
// used sparingly as this dashboard's one signature device: on the wordmark,
// and as the active-nav indicator in place of a plain highlight.
function RegMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" />
      <path d="M8 0V16M0 8H16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const THEME = {
  dark: {
    shellBg: '#0E1117',
    text: '#F0EDE8',
    sidebarBg: 'rgba(21,28,36,0.6)',
    sidebarBorder: 'border-white/10',
    navText: 'text-white/45 hover:text-white/80',
    navActive: 'text-[#C6A85C]',
    muted: 'text-white/30',
    accent: 'text-[#C6A85C]',
    topbarBg: 'rgba(14,17,23,0.9)',
  },
  light: {
    shellBg: 'var(--color-bg-primary)',
    text: 'var(--color-text-heading)',
    sidebarBg: 'rgba(253,252,250,0.7)',
    sidebarBorder: 'border-border',
    navText: 'text-text-muted hover:text-text-heading',
    navActive: 'text-accent-gold',
    muted: 'text-text-muted',
    accent: 'text-accent-gold',
    topbarBg: 'rgba(253,252,250,0.92)',
  },
} as const;

export default function DashboardShell({
  theme,
  section,
  navItems,
  userLabel,
  roleLabel,
  logoutSlot,
  children,
  analyticsSlot,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const t = THEME[theme];

  const isActive = (item: DashboardNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.shellBg, color: t.text, fontFamily: 'var(--font-dm-sans)' }}
      className="flex"
    >
      {/* Sidebar — desktop */}
      <aside
        className={`hidden w-60 shrink-0 flex-col border-r ${t.sidebarBorder} md:flex`}
        style={{ background: t.sidebarBg, backdropFilter: 'blur(12px)' }}
      >
        <SidebarContent theme={theme} section={section} navItems={navItems} isActive={isActive} logoutSlot={logoutSlot} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-10 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r ${t.sidebarBorder}`}
            style={{ background: theme === 'dark' ? '#151C24' : 'var(--color-bg-primary)' }}
          >
            <SidebarContent
              theme={theme}
              section={section}
              navItems={navItems}
              isActive={isActive}
              logoutSlot={logoutSlot}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={`flex items-center justify-between border-b ${t.sidebarBorder} px-5 py-3 md:px-8`}
          style={{ background: t.topbarBg, backdropFilter: 'blur(8px)' }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`font-mono text-xs uppercase tracking-widest ${t.muted} md:hidden`}
            aria-label="Open menu"
          >
            ☰ Menu
          </button>
          <span className="hidden font-mono text-xs uppercase tracking-widest md:block" style={{ opacity: 0.4 }}>
            {section}
          </span>
          <div className="flex items-center gap-3">
            {analyticsSlot && (
              <button
                type="button"
                onClick={() => setAnalyticsOpen((v) => !v)}
                className={`hidden border px-2.5 py-1 font-mono text-sm uppercase tracking-widest transition-colors xl:inline-block ${t.sidebarBorder} ${
                  analyticsOpen ? t.navActive : t.muted
                }`}
              >
                {analyticsOpen ? 'Hide' : 'Show'} analytics
              </button>
            )}
            {roleLabel && (
              <span className={`hidden border px-2 py-0.5 font-mono text-sm uppercase tracking-widest sm:inline-block ${t.sidebarBorder} ${t.muted}`}>
                {roleLabel}
              </span>
            )}
            <span className={`font-mono text-xs ${t.muted}`}>{userLabel}</span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-5 py-10 md:px-10 md:py-14">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>

          {analyticsSlot && analyticsOpen && (
            <aside
              className={`hidden w-80 shrink-0 overflow-y-auto border-l ${t.sidebarBorder} px-5 py-8 xl:block`}
              style={{ background: t.sidebarBg, backdropFilter: 'blur(12px)' }}
            >
              {analyticsSlot}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  theme,
  section,
  navItems,
  isActive,
  logoutSlot,
  onNavigate,
}: {
  theme: 'dark' | 'light';
  section: string;
  navItems: DashboardNavItem[];
  isActive: (item: DashboardNavItem) => boolean;
  logoutSlot: React.ReactNode;
  onNavigate?: () => void;
}) {
  const t = THEME[theme];

  return (
    <>
      <div className="px-6 py-7">
        <div className="flex items-center gap-2">
          <RegMark className={`h-3.5 w-3.5 ${t.accent}`} />
          <span className="font-mono text-xs uppercase tracking-widest" style={{ opacity: 0.4 }}>
            {section}
          </span>
        </div>
        <p className="mt-1 font-display text-xl font-light leading-tight">Memories in Prints</p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2.5 font-mono text-sm uppercase tracking-wider transition-colors ${
                active ? t.navActive : t.navText
              }`}
            >
              <RegMark className={`h-2.5 w-2.5 shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t px-6 py-5 ${t.sidebarBorder}`}>
        <Link
          href="/"
          className={`block font-mono text-xs uppercase tracking-widest ${t.navText}`}
        >
          ← Back to site
        </Link>
        <div className="mt-3">{logoutSlot}</div>
      </div>
    </>
  );
}
