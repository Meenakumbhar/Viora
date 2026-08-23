export const THEME = {
  light: {
    panel: 'border border-border bg-bg-primary',
    tab: 'border-border text-text-muted',
    tabActive: 'border-accent-gold text-accent-gold',
    muted: 'text-text-muted',
    heading: 'text-text-heading',
    inputBg: 'bg-bg-primary border border-border text-text-heading',
    button: 'bg-accent-gold text-bg-primary hover:opacity-90',
    buttonOutline: 'border border-border text-text-muted hover:border-accent-gold hover:text-accent-gold',
    sidebarBorder: 'border-border',
    popoverBg: 'bg-bg-primary border border-border text-text-heading',
    rowBorder: 'border-border',
  },
  dark: {
    panel: 'border border-white/10 bg-[#151C24]',
    tab: 'border-white/15 text-white/40',
    tabActive: 'border-[#C6A85C] text-[#C6A85C]',
    muted: 'text-white/40',
    heading: 'text-white/90',
    inputBg: 'bg-transparent border border-white/20 text-white',
    button: 'bg-[#C6A85C] text-[#0E1117] hover:opacity-90',
    buttonOutline: 'border border-white/20 text-white/50 hover:border-[#C6A85C] hover:text-[#C6A85C]',
    sidebarBorder: 'border-white/10',
    popoverBg: 'bg-[#0E1117] border border-white/15 text-white',
    rowBorder: 'border-white/5',
  },
} as const;

export type DesignReviewTheme = keyof typeof THEME;
export type ThemeTokens = (typeof THEME)[DesignReviewTheme];
