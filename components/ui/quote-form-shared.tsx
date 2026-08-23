'use client';

/* ── Shared building blocks for the quote forms ──────────────────────────
   Used by both the full multi-step QuoteForm (guest / first-time enquiries)
   and QuickQuoteForm (logged-in customers who only need to fill in what
   changes per order). Pulled out here once a second consumer needed the
   same date/quantity/service-type UI, rather than duplicating ~500 lines
   of interactive component logic. ─────────────────────────────────────── */

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type ChangeEvent,
} from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { isServiceSlugActive } from '@/lib/active-services';

/* ── Service types ─────────────────────────────────────────────────────── */

export const ALL_SERVICE_TYPES = [
  { label: 'Wedding & Events', emoji: '💍', slug: 'wedding-events' },
  { label: 'Funeral & Memorial', emoji: '🕊️', slug: 'funeral-memorial' },
  { label: 'Sports & Branding', emoji: '🏆', slug: 'sports-branding' },
  { label: 'Graphic Design', emoji: '🎨', slug: 'graphic-design' },
  { label: 'Print & Production', emoji: '🖨️', slug: 'print-production' },
  { label: 'Not sure', emoji: '💬', slug: null },
];

// "Not sure" always stays — it's a catch-all, not a specific paused service.
export const SERVICE_TYPES = ALL_SERVICE_TYPES.filter((s) => !s.slug || isServiceSlugActive(s.slug));

export const SERVICE_PROMPTS: Record<string, string> = {
  'Wedding & Events': 'Tell us about your wedding date, venue style, colour palette, and approximate guest count...',
  'Funeral & Memorial': 'Share the name of the person being honoured, any themes, photos, or specific wishes...',
  'Sports & Branding': 'Describe your team, league, branding colours, and what you need printed...',
  'Graphic Design': 'Describe the project, your brand style, target audience, and any existing assets...',
  'Print & Production': 'Tell us about your print specs, quantities, finish preferences, and delivery timeline...',
  'Not sure': "Tell us anything about your project — we'll help figure out the best approach...",
  default: 'Tell us about your project, style preferences, and any key details...',
};

/* ── Date helpers ──────────────────────────────────────────────────────── */

export function toDateInputValue(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function formatDateDisplay(d: Date | undefined): string {
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Pill chip selector ────────────────────────────────────────────────── */

export function PillChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-4 py-2.5 border font-body text-base transition-all duration-200 text-left',
        'hover:border-accent-gold hover:text-accent-gold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
        selected
          ? 'border-accent-gold bg-accent-gold/10 text-accent-gold scale-[1.02]'
          : 'border-border bg-cat-surface text-cat-heading',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ── Quantity combobox ─────────────────────────────────────────────────── */

// All integers 1‑1000 for the quantity combobox
const ALL_QUANTITIES = Array.from({ length: 1000 }, (_, i) => i + 1);

export function QuantityCombobox({
  value,
  disabled,
  onChange,
}: {
  value: string | null;
  disabled: boolean;
  onChange: (v: string | null) => void;
}) {
  const [inputVal, setInputVal] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input when parent clears the value (e.g. "undecided" checked)
  useEffect(() => {
    setInputVal(value ?? '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!inputVal.trim()) return ALL_QUANTITIES;
    const n = parseInt(inputVal, 10);
    if (isNaN(n)) return [];
    // Show numbers that start with the typed digits
    return ALL_QUANTITIES.filter((q) => String(q).startsWith(inputVal.trim()));
  }, [inputVal]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4); // digits only, max 4 chars
    setInputVal(val);
    setOpen(true);
    setHighlighted(0);
    // Immediately reflect freetext as the value too
    onChange(val || null);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown') setOpen(true);
      // With the dropdown closed there's nothing here to confirm, but Enter
      // must still be swallowed — left alone it bubbles up as the browser's
      // native implicit form submission (this is the only text input on a
      // multi-step quote form, which is exactly the case that triggers it).
      else if (e.key === 'Enter') e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted] !== undefined) select(String(filtered[highlighted]));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function select(v: string) {
    setInputVal(v);
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative inline-flex w-40 ${disabled ? 'pointer-events-none opacity-40' : ''}`}>
      {/* Input */}
      <input
        id="quantity-input"
        type="text"
        inputMode="numeric"
        placeholder="e.g. 150"
        value={inputVal}
        disabled={disabled}
        autoComplete="off"
        onChange={handleInput}
        onFocus={() => { setOpen(true); setHighlighted(0); }}
        onKeyDown={handleKey}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full rounded-full border border-border bg-surface py-2 pl-4 pr-8 font-body text-base text-text-heading placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold/40 disabled:cursor-not-allowed"
      />
      {/* Chevron */}
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted"
        aria-hidden="true"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      {/* Scrollable dropdown */}
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-bg-primary shadow-lg"
        >
          {filtered.map((q, i) => (
            <li
              key={q}
              role="option"
              aria-selected={String(q) === (value ?? '')}
              onMouseDown={() => select(String(q))}
              className={[
                'cursor-pointer px-4 py-1.5 font-body text-base transition-colors',
                i === highlighted
                  ? 'bg-accent-gold/10 text-accent-gold'
                  : 'text-text-heading hover:bg-bg-secondary',
              ].join(' ')}
            >
              {q}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Date picker ─────────────────────────────────────────────────────────── */

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
// Years: from current year to +8 years
const YEAR_LIST = Array.from({ length: 9 }, (_, i) => CURRENT_YEAR + i);

type DatePickerView = 'days' | 'months' | 'years';

export function DateField({
  value,
  onChange,
  label = '',
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label?: string;
}) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DatePickerView>('days');
  // controlled month shown in the calendar
  const [month, setMonth] = useState<Date>(value ?? today);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const yearListRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
        setView('days');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // scroll selected year into view when year picker opens
  useEffect(() => {
    if (view === 'years' && yearListRef.current) {
      const selected = yearListRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [view]);

  const displayValue = formatDateDisplay(value);
  const lifted = focused || !!value;

  function handleDaySelect(d: Date | undefined) {
    onChange(d);
    if (d) { setOpen(false); setFocused(false); setView('days'); }
  }

  function selectMonth(monthIdx: number) {
    setMonth(new Date(month.getFullYear(), monthIdx, 1));
    setView('days');
  }

  function selectYear(year: number) {
    setMonth(new Date(year, month.getMonth(), 1));
    setView('days');
  }

  // custom nav: prev / next month
  function prevMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }
  function nextMonth() { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        id="quote-date-btn"
        onClick={() => { setOpen((o) => !o); setFocused(true); setView('days'); }}
        className="w-full border border-border bg-cat-surface px-4 pt-6 pb-2 text-left text-cat-heading transition-all duration-200 outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
      >
        {displayValue
          ? <span>{displayValue}</span>
          : <span className="text-text-muted/50 text-base">Pick a date&hellip;</span>
        }
      </button>

      {/* Floating label */}
      <label
        htmlFor="quote-date-btn"
        className={[
          'absolute left-4 pointer-events-none transition-all duration-200 font-body',
          lifted ? 'top-1.5 text-base uppercase tracking-wider text-accent-gold' : 'top-4 text-body-base text-text-muted',
        ].join(' ')}
      >
        {label}
      </label>

      {/* Right icons */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
            className="text-text-muted hover:text-accent-gold transition-colors"
            aria-label="Clear date"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <svg className="h-4 w-4 text-text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 border border-border bg-bg-primary shadow-2xl" style={{ minWidth: '300px' }}>

          {/* ── Custom header ─────────────────────────── */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            {/* Prev month — hidden during month/year view */}
            {view === 'days' ? (
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-text-muted hover:text-accent-gold transition-colors"
                aria-label="Previous month"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <div className="w-7" />
            )}

            {/* Month + Year labels — clickable */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView(view === 'months' ? 'days' : 'months')}
                className={[
                  'px-2 py-1 font-display text-base tracking-wide transition-colors',
                  view === 'months' ? 'text-accent-gold' : 'text-text-heading hover:text-accent-gold',
                ].join(' ')}
              >
                {MONTH_NAMES[month.getMonth()]}
              </button>
              <button
                type="button"
                onClick={() => setView(view === 'years' ? 'days' : 'years')}
                className={[
                  'px-2 py-1 font-mono text-base transition-colors',
                  view === 'years' ? 'text-accent-gold' : 'text-text-muted hover:text-accent-gold',
                ].join(' ')}
              >
                {month.getFullYear()}
              </button>
            </div>

            {/* Next month */}
            {view === 'days' ? (
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-text-muted hover:text-accent-gold transition-colors"
                aria-label="Next month"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('days')}
                className="p-1.5 text-text-muted hover:text-accent-gold transition-colors"
                aria-label="Back to day view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Month grid ────────────────────────────── */}
          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1 p-3">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = idx === month.getMonth();
                const isPast = new Date(month.getFullYear(), idx + 1, 0) < today;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isPast}
                    onClick={() => selectMonth(idx)}
                    className={[
                      'py-2 text-base font-body transition-all duration-150',
                      isSelected
                        ? 'bg-accent-gold text-bg-primary font-semibold'
                        : isPast
                          ? 'text-text-muted/30 cursor-not-allowed'
                          : 'text-text-heading hover:bg-accent-gold/10 hover:text-accent-gold',
                    ].join(' ')}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Year list ─────────────────────────────── */}
          {view === 'years' && (
            <div
              ref={yearListRef}
              className="overflow-y-auto"
              style={{ maxHeight: '200px' }}
            >
              {YEAR_LIST.map((year) => {
                const isSelected = year === month.getFullYear();
                return (
                  <button
                    key={year}
                    type="button"
                    data-selected={isSelected}
                    onClick={() => selectYear(year)}
                    className={[
                      'w-full px-4 py-2.5 text-left font-mono text-base transition-colors',
                      isSelected
                        ? 'bg-accent-gold text-bg-primary font-semibold'
                        : 'text-text-heading hover:bg-accent-gold/10 hover:text-accent-gold',
                    ].join(' ')}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Day grid (DayPicker, no caption rendered) ── */}
          {view === 'days' && (
            <div className="rdp-custom-wrapper">
              <DayPicker
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={value}
                onSelect={handleDaySelect}
                disabled={{ before: today }}
                hideNavigation
                className="rdp-custom"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Auto-grow textarea with char counter ───────────────────────────────── */

export function AutoTextarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  label,
  optional = true,
  maxLength = 800,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  label: string;
  optional?: boolean;
  maxLength?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const remaining = maxLength - value.length;
  const nearLimit = remaining <= Math.min(100, Math.round(maxLength * 0.15));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.max(120, el.scrollHeight) + 'px';
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        name={name ?? id}
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={4}
        style={{ resize: 'none', overflow: 'hidden' }}
        className="w-full border border-border bg-cat-surface px-4 pt-8 pb-3 text-cat-heading transition-all duration-200 outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold font-body text-body-base leading-relaxed"
        placeholder={focused ? placeholder : ''}
      />
      <label
        htmlFor={id}
        className={[
          'absolute left-4 pointer-events-none transition-all duration-200 font-body',
          lifted ? 'top-2 text-base uppercase tracking-wider text-accent-gold' : 'top-4 text-body-base text-text-muted',
        ].join(' ')}
      >
        {label} {optional && <span className="normal-case text-text-muted">(optional)</span>}
      </label>
      {/* Character counter */}
      {(focused || value.length > 0) && (
        <p className={`mt-1 text-right font-mono text-base transition-colors ${nearLimit ? 'text-accent-blush' : 'text-text-muted'
          }`}>
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
}
