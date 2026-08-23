'use client';

import { createContext, useContext } from 'react';

export type DashboardTheme = 'dark' | 'light';

// Provided by DashboardShell (which owns the actual toggle state) so that
// arbitrary page content — everything rendered as `children`, which
// DashboardShell has no other way to reach — can react to the live theme
// instead of assuming dark, which was a safe assumption before the toggle
// existed and no longer is.
export const DashboardThemeContext = createContext<DashboardTheme>('dark');

export function useDashboardTheme(): DashboardTheme {
  return useContext(DashboardThemeContext);
}

// Shared class fragments for the handful of "surface" pieces reused across
// staff dashboard panels (queue list, activity feed, workload panel, etc.)
// so each one doesn't reinvent a slightly different light/dark pair.
export const PANEL_THEME = {
  dark: {
    panelBorder: 'border-white/10',
    rowBorder: 'divide-white/5',
    rowBorderSingle: 'border-white/5',
    surface: 'bg-white/[0.02]',
    hoverRow: 'hover:bg-white/[0.02]',
    heading: 'text-white/85',
    text: 'text-white/70',
    muted: 'text-white/40',
    faint: 'text-white/25',
    pillBorder: 'border-white/10',
    pillText: 'text-white/40',
    thumbBorder: 'border-white/15',
  },
  light: {
    panelBorder: 'border-border',
    rowBorder: 'divide-border/60',
    rowBorderSingle: 'border-border/60',
    surface: 'bg-white/50',
    hoverRow: 'hover:bg-black/[0.02]',
    heading: 'text-text-heading',
    text: 'text-text-heading/80',
    muted: 'text-text-muted',
    faint: 'text-text-muted/70',
    pillBorder: 'border-border',
    pillText: 'text-text-muted',
    thumbBorder: 'border-border',
  },
} as const;
