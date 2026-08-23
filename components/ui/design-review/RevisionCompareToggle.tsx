'use client';

import { THEME } from './theme';

export interface CompareRevisionOption {
  version: number;
  label?: string | null;
  image_urls: string[];
}

interface RevisionCompareToggleProps {
  options: CompareRevisionOption[];
  active: CompareRevisionOption | null;
  onChange: (option: CompareRevisionOption | null) => void;
  theme: keyof typeof THEME;
}

export default function RevisionCompareToggle({ options, active, onChange, theme }: RevisionCompareToggleProps) {
  const t = THEME[theme];
  if (options.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className={`font-mono text-[11px] uppercase tracking-widest ${t.muted}`}>Compare with</label>
      <select
        value={active?.version ?? ''}
        onChange={(e) => {
          const version = Number(e.target.value);
          onChange(options.find((o) => o.version === version) ?? null);
        }}
        className={`px-2 py-1 font-mono text-[11px] uppercase tracking-widest outline-none ${t.inputBg}`}
      >
        <option value="">None</option>
        {options.map((o) => (
          <option key={o.version} value={o.version}>
            {o.label?.trim() || `v${o.version}`}
          </option>
        ))}
      </select>
      {active && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`font-mono text-[11px] uppercase tracking-widest ${t.muted} hover:text-red-400`}
        >
          Exit compare ×
        </button>
      )}
    </div>
  );
}
