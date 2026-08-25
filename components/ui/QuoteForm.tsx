'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type FormEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { readPortfolioCart, clearPortfolioCart, type PortfolioCartItem } from '@/utils/portfolio-cart';
import type { PublicUser } from '@/types/database';
import {
  SERVICE_TYPES,
  SERVICE_PROMPTS,
  PillChip,
  DateField,
  AutoTextarea,
  toDateInputValue,
} from '@/components/ui/quote-form-shared';

/* ── Types ─────────────────────────────────────────────────────────────── */

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  phone: string;
  country: string;
  serviceType: string;
  eventDate: Date | undefined;
  description: string;
  source: string;
}

/* ── Constants ─────────────────────────────────────────────────────────── */

const INITIAL_DATA: FormData = {
  name: '',
  email: '',
  phone: '',
  country: '',
  serviceType: '',
  eventDate: undefined,
  description: '',
  source: '',
};

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand',
  'Ireland', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Finland',
  'South Africa', 'Nigeria', 'Kenya', 'India', 'Pakistan', 'Japan', 'Singapore',
  'Hong Kong', 'United Arab Emirates', 'Saudi Arabia', 'Brazil', 'Mexico',
  'Argentina', 'Colombia', 'Philippines', 'Malaysia',
];

const SOURCES = [
  { label: 'Google', emoji: '🔍' },
  { label: 'Instagram', emoji: '📸' },
  { label: 'Referral', emoji: '👥' },
  { label: 'Funeral Director', emoji: '🕊️' },
  { label: 'Wedding Planner', emoji: '💐' },
  { label: 'Other', emoji: '✨' },
];

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com', 'me.com', 'live.com'];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Floating label input ──────────────────────────────────────────────── */

function FloatingInput({
  id,
  label,
  required,
  type = 'text',
  value,
  onChange,
  onBlur,
  autoComplete,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  children?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        name={id.replace('quote-', '')}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        className={[
          'w-full rounded-2xl border bg-cat-surface px-4 pt-6 pb-2 text-cat-heading transition-all duration-200 outline-none',
          'focus:border-accent-gold focus:ring-1 focus:ring-accent-gold',
          lifted ? 'border-border' : 'border-border',
        ].join(' ')}
      />
      <label
        htmlFor={id}
        className={[
          'absolute left-4 pointer-events-none transition-all duration-200 font-body',
          lifted ? 'top-1.5 text-base uppercase tracking-wider text-accent-gold' : 'top-4 text-body-base text-text-muted',
        ].join(' ')}
      >
        {label}
        {required && <span className="text-accent-gold ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ── Country combobox ─────────────────────────────────────────────────── */

function CountryCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.length === 0
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but didn't select, revert to last valid value
        if (!COUNTRIES.includes(query)) setQuery(value);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [query, value]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function select(country: string) {
    onChange(country);
    setQuery(country);
    setOpen(false);
  }

  const [focused, setFocused] = useState(false);
  const lifted = focused || query.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <input
        id="quote-country"
        type="text"
        value={query}
        autoComplete="off"
        onFocus={() => { setOpen(true); setFocused(true); setHighlighted(0); }}
        onBlur={() => setFocused(false)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onKeyDown={handleKey}
        className="w-full rounded-2xl border border-border bg-cat-surface px-4 pt-6 pb-2 text-cat-heading transition-all duration-200 outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      <label
        htmlFor="quote-country"
        className={[
          'absolute left-4 pointer-events-none transition-all duration-200 font-body',
          lifted ? 'top-1.5 text-base uppercase tracking-wider text-accent-gold' : 'top-4 text-body-base text-text-muted',
        ].join(' ')}
      >
        Country (optional)
      </label>
      {/* Dropdown arrow */}
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
      </svg>

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-bg-primary shadow-lg"
        >
          {filtered.map((c, i) => (
            <li
              key={c}
              role="option"
              aria-selected={value === c}
              onMouseDown={() => select(c)}
              className={[
                'px-4 py-2.5 font-body text-body-base cursor-pointer transition-colors',
                i === highlighted ? 'bg-accent-gold/10 text-accent-gold' : 'text-cat-heading hover:bg-bg-secondary',
              ].join(' ')}
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Email input with domain autocomplete ─────────────────────────────── */

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  useEffect(() => {
    const atIdx = value.indexOf('@');
    if (atIdx !== -1) {
      const afterAt = value.slice(atIdx + 1);
      const matches = afterAt.length === 0
        ? EMAIL_DOMAINS
        : EMAIL_DOMAINS.filter((d) => d.startsWith(afterAt));
      setSuggestions(matches);
      setOpen(matches.length > 0);
    } else {
      setOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectDomain(domain: string) {
    const atIdx = value.indexOf('@');
    const base = atIdx !== -1 ? value.slice(0, atIdx + 1) : value + '@';
    onChange(base + domain);
    setOpen(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') { if (suggestions[highlighted]) { e.preventDefault(); selectDomain(suggestions[highlighted]); } }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id="quote-email"
        name="email"
        type="email"
        value={value}
        required
        autoComplete="email"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        className="w-full rounded-2xl border border-border bg-cat-surface px-4 pt-6 pb-2 text-cat-heading transition-all duration-200 outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold"
      />
      <label
        htmlFor="quote-email"
        className={[
          'absolute left-4 pointer-events-none transition-all duration-200 font-body',
          lifted ? 'top-1.5 text-base uppercase tracking-wider text-accent-gold' : 'top-4 text-body-base text-text-muted',
        ].join(' ')}
      >
        Email<span className="text-accent-gold ml-0.5">*</span>
      </label>

      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 rounded-2xl border border-border bg-bg-primary shadow-lg">
          {suggestions.map((d, i) => {
            const atIdx = value.indexOf('@');
            const base = atIdx !== -1 ? value.slice(0, atIdx + 1) : value + '@';
            return (
              <li
                key={d}
                onMouseDown={() => selectDomain(d)}
                className={[
                  'px-4 py-2.5 font-mono text-base cursor-pointer flex items-center gap-1 transition-colors',
                  i === highlighted ? 'bg-accent-gold/10 text-accent-gold' : 'text-cat-heading hover:bg-bg-secondary',
                ].join(' ')}
              >
                <span className="text-text-muted">{base}</span>
                <span className="font-semibold">{d}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — a single continuous form (no step wizard). Everything a
   customer might need to tell us lives on one page, grouped into three
   labelled sections purely for scannability.
   ═══════════════════════════════════════════════════════════════════════════ */

interface QuoteFormProps {
  /** Prefills the service-type field — only applied if it exactly matches a known service label. */
  initialService?: string;
  /** Prefills the brief-description field, e.g. from a "Request similar" reorder link. */
  initialDetails?: string;
  /** Only true when arriving via the "Request a final quote" button on /pricing — otherwise any leftover cart items are ignored so a plain quote request doesn't get treated as cart-linked by default. */
  fromCart?: boolean;
}

export default function QuoteForm({ initialService, initialDetails, fromCart }: QuoteFormProps = {}) {
  const [data, setData] = useState<FormData>(() => {
    const matchedService = initialService
      ? SERVICE_TYPES.find((s) => s.label.toLowerCase() === initialService.toLowerCase())?.label
      : undefined;
    return {
      ...INITIAL_DATA,
      serviceType: matchedService ?? INITIAL_DATA.serviceType,
      description: initialDetails ?? INITIAL_DATA.description,
    };
  });
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [enquiryId, setEnquiryId] = useState<string | null>(null);

  /* ── Portfolio cart context — so a quote raised from "Buy" on a portfolio
     item stays linked to that item, instead of arriving as a generic request.
     Only loaded when the customer actually arrived via the cart checkout
     flow — otherwise a stale cart shouldn't hijack an unrelated quote. ──── */
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);
  const [includeCartItems, setIncludeCartItems] = useState(true);
  const [serviceOverride, setServiceOverride] = useState(false);

  useEffect(() => {
    if (fromCart) setCartItems(readPortfolioCart());
  }, [fromCart]);

  // If every cart item implies the same service, there's nothing to ask —
  // re-picking a service the customer already told us via the product/
  // portfolio item they chose would just be repeating themselves.
  const derivedServiceType = useMemo(() => {
    if (!includeCartItems || cartItems.length === 0) return null;
    const first = cartItems[0].serviceType;
    if (!first) return null;
    return cartItems.every((item) => item.serviceType === first) ? first : null;
  }, [cartItems, includeCartItems]);

  useEffect(() => {
    if (derivedServiceType) {
      setData((prev) => ({ ...prev, serviceType: derivedServiceType }));
    }
  }, [derivedServiceType]);

  /* ── Returning-customer prefill — a logged-in user who already has saved
     contact details shouldn't have to retype them; the fields below just
     arrive pre-filled (and still editable) rather than needing a separate
     "skip this step" affordance now that there's only one step. ─────────── */
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/me')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then((json) => {
        if (!cancelled && json.success) setProfile(json.data);
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setProfileLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!profileLoaded || !profile) return;
    setData((prev) => ({
      ...prev,
      name: prev.name || profile.name || '',
      email: prev.email || profile.email || '',
      phone: prev.phone || profile.phone || '',
      country: prev.country || profile.country || '',
    }));
  }, [profileLoaded, profile]);

  /* ── Field handlers ───────────────────────────────────────────────────── */

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (state === 'error') { setState('idle'); setErrorMessage(''); }
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (state === 'error') { setState('idle'); setErrorMessage(''); }
  }

  /* ── Validation ──────────────────────────────────────────────────────── */

  function validateAll(): string | null {
    if (!data.name.trim()) return 'Please enter your name.';
    if (!data.email.trim()) return 'Please enter your email address.';
    if (!isValidEmail(data.email)) return 'Please enter a valid email address.';
    if (!data.serviceType) return 'Please select a service type.';
    return null;
  }

  /* ── Submit ──────────────────────────────────────────────────────────── */

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validateAll();
    if (validationError) { setErrorMessage(validationError); setState('error'); return; }

    setState('loading');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          country: data.country,
          service_type: data.serviceType,
          event_date: data.eventDate ? toDateInputValue(data.eventDate) : null,
          quantity_estimate: null,
          description: data.description,
          source: data.source || null,
          portfolio_items: includeCartItems && cartItems.length > 0
            ? cartItems.map((item) => ({ id: item.id, title: item.title, category: item.category }))
            : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Something went wrong. Please try again.');
      }
      if (includeCartItems && cartItems.length > 0) {
        clearPortfolioCart();
      }
      setEnquiryId(body.data?.id ?? null);
      setState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  }

  /* ── Success state ───────────────────────────────────────────────────── */

  if (state === 'success') {
    return (
      <div className="relative flex flex-col items-center overflow-hidden rounded-[2rem] border border-border py-16 text-center">
        {/* Background — watercolor thank-you card art */}
        <Image
          src="/images/ThankYou-Banner.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 60vw, 100vw"
        />

        <div className="relative z-10 flex flex-col items-center px-6">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold"
            style={{ animation: 'successPop 0.4s ease' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
            </svg>
          </div>
          <h3 className="font-display text-display-md text-text-primary">
            Thank you, {data.name.split(' ')[0]}
          </h3>
          <p className="mt-4 max-w-md font-body text-body-base text-text-muted">
            Your request is with us. We&apos;ll be in touch within 24 hours.
          </p>

          {enquiryId && (
            <div className="mt-8 w-full max-w-md rounded-2xl border border-accent-gold/40 bg-accent-gold/5 p-6 text-left">
              <p className="font-mono text-base uppercase tracking-widest text-accent-gold">Next step</p>
              <p className="mt-2 font-body text-body-base text-text-heading">
                Fill out your order form now so we can start on the design straight away — you don&apos;t need to wait for our reply.
              </p>
              <Link
                href={`/order-form/${enquiryId}`}
                className="mt-4 inline-flex items-center justify-center gap-2 bg-accent-gold px-6 py-3 font-body font-medium uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-dark"
              >
                Fill out order form &rarr;
              </Link>
            </div>
          )}

          <Link
            href="/portfolio"
            className="mt-8 inline-flex items-center gap-2 font-body text-label uppercase tracking-wider text-accent-gold link-underline"
          >
            Browse our portfolio &rarr;
          </Link>
        </div>
      </div>
    );
  }

  /* ── Description placeholder based on service ───────────────────────── */

  const descPlaceholder = SERVICE_PROMPTS[data.serviceType] ?? SERVICE_PROMPTS['default'];

  /* ── Form ────────────────────────────────────────────────────────────── */

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* ── Portfolio cart context banner ───────────────────────────────── */}
      {cartItems.length > 0 && includeCartItems && (
        <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-accent-gold/40 bg-accent-gold/5 px-5 py-4 animate-fadeIn">
          <div>
            <p className="font-mono text-base uppercase tracking-widest text-accent-gold">
              Requesting a quote for {cartItems.length} item{cartItems.length === 1 ? '' : 's'} from your cart
            </p>
            <p className="mt-1.5 font-body text-base text-text-muted">
              {cartItems.map((item) => item.title).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIncludeCartItems(false);
              // Decoupling from the cart means the derived service no longer
              // applies either — back to asking, like a guest enquiry.
              if (derivedServiceType) setField('serviceType', '');
            }}
            className="shrink-0 font-mono text-base uppercase tracking-wider text-text-muted underline hover:text-text-heading"
          >
            Not about this
          </button>
        </div>
      )}

      {/* ── Who you are ──────────────────────────────────────────────── */}
      <div className="space-y-5">
        <h2 className="font-display text-xl text-text-heading">Who you are</h2>

        {/* Name */}
        <FloatingInput
          id="quote-name"
          label="Your full name"
          required
          value={data.name}
          onChange={(e) => {
            setField('name', e.target.value);
          }}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            setField(
              'name',
              e.target.value.replace(/\b\w/g, (c) => c.toUpperCase())
            );
          }}
          autoComplete="name"
        />

        {/* Email */}
        <EmailInput value={data.email} onChange={(v) => setField('email', v)} />

        {/* Phone — optional */}
        <FloatingInput
          id="quote-phone"
          label="Phone number (optional)"
          type="tel"
          value={data.phone}
          onChange={handleChange}
          autoComplete="tel"
        />

        {/* Country */}
        <CountryCombobox value={data.country} onChange={(v) => setField('country', v)} />
      </div>

      {/* ── Your project ─────────────────────────────────────────────── */}
      <div className="mt-08 space-y-4 border-t border-border pt-8">
        <h2 className="font-display text-xl text-text-heading">About your project</h2>

        {/* Service type — derived from the cart when every item agrees, otherwise pill chips */}
        <div>
          {derivedServiceType && !serviceOverride ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-cat-surface px-4 py-3">
              <div>
                <p className="font-mono text-base uppercase tracking-widest text-text-muted">Service</p>
                <p className="mt-1 font-body text-cat-heading">{derivedServiceType}</p>
              </div>
              <button
                type="button"
                onClick={() => setServiceOverride(true)}
                className="shrink-0 font-mono text-base uppercase tracking-wider text-accent-gold underline hover:text-accent-gold-dark"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 font-body text-base text-text-muted uppercase tracking-wider">
                Service type<span className="text-accent-gold ml-0.5">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_TYPES.map((s) => (
                  <PillChip
                    key={s.label}
                    selected={data.serviceType === s.label}
                    onClick={() => setField('serviceType', s.label)}
                  >
                    <span className="mr-1.5">{s.emoji}</span>
                    {s.label}
                  </PillChip>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Date */}
        <div>
          <p className="mb-3 font-body text-base text-text-muted uppercase tracking-wider">
            Delivery Date
          </p>
          <DateField value={data.eventDate} onChange={(d) => setField('eventDate', d)} />
        </div>
      </div>

      {/* ── Final details ────────────────────────────────────────────── */}
      <div className="mt-08 space-y-08 border-t border-border pt-8">
        <h2 className="font-display text-xl text-text-heading">Final details</h2>

        {/* Description */}
        <AutoTextarea
          id="quote-description"
          name="description"
          label="Brief description"
          value={data.description}
          onChange={handleChange}
          placeholder={descPlaceholder}
        />
      </div>

      {/* ── Error message ─────────────────────────────────────────────── */}
      {state === 'error' && errorMessage && (
        <p className="mt-4 text-base text-accent-blush" role="alert">
          {errorMessage}
        </p>
      )}

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={state === 'loading'}
          className={[
            'rounded-2xl bg-accent-gold text-bg-primary px-8 py-3.5 font-body font-medium uppercase tracking-wider',
            'transition-all duration-300 hover:bg-accent-gold-dark',
            'focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
            'disabled:opacity-50',
            state === 'loading' ? 'animate-pulse' : '',
          ].join(' ')}
        >
          {state === 'loading' ? 'Sending…' : 'Send My Request →'}
        </button>
      </div>
    </form>
  );
}
