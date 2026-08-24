interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  theme?: 'dark' | 'light';
  accent?: string;
}

const THEME = {
  dark: {
    card: 'border-white/10 bg-white/[0.03]',
    label: 'text-white/40',
    sub: 'text-white/25',
  },
  light: {
    card: 'border-border bg-white/40',
    label: 'text-text-muted',
    sub: 'text-text-muted/70',
  },
} as const;

export default function StatCard({ label, value, sub, theme = 'dark', accent }: StatCardProps) {
  const t = THEME[theme];
  return (
    <div className={`border p-6 ${t.card}`}>
      <p className={`font-mono text-sm uppercase tracking-widest ${t.label}`}>{label}</p>
      <p className="mt-2 font-display text-5xl font-light" style={{ color: accent ?? '#C6A85C' }}>
        {value}
      </p>
      {sub && <p className={`mt-1.5 font-mono text-sm ${t.sub}`}>{sub}</p>}
    </div>
  );
}
