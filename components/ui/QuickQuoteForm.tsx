'use client';

/* ── Quick quote form — for logged-in customers only ─────────────────────
   The full QuoteForm (components/ui/QuoteForm.tsx) asks a first-time
   visitor everything: who they are, what they need, and how they found us.
   A returning, logged-in customer already has an account with their name,
   email, phone, and country saved — repeating that would just be friction.
   This form only asks what actually changes order to order: the service,
   date, quantity, delivery/venue address, and any extra details. ───────── */

import { useState, useEffect, useMemo, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface QuickFormData {
  serviceType: string;
  eventDate: Date | undefined;
  address: string;
  description: string;
}

const INITIAL_DATA: QuickFormData = {
  serviceType: '',
  eventDate: undefined,
  address: '',
  description: '',
};

interface QuickQuoteFormProps {
  user: PublicUser;
  /** Prefills the service field — used for a "Request similar" reorder link. */
  initialService?: string;
  /** Prefills the description field, e.g. from a "Request similar" reorder link. */
  initialDetails?: string;
  /** Only true when arriving via the "Request a final quote" button on /pricing — otherwise any leftover cart items are ignored so a plain quote request doesn't get treated as cart-linked by default. */
  fromCart?: boolean;
}

export default function QuickQuoteForm({ user, initialService, initialDetails, fromCart }: QuickQuoteFormProps) {
  const router = useRouter();
  const [data, setData] = useState<QuickFormData>(() => {
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

  // Give them a moment to read the confirmation, then take them straight to
  // the order form — that's the actual next step, not just the order list.
  useEffect(() => {
    if (state !== 'success') return;
    const timer = setTimeout(() => router.push(enquiryId ? `/order-form/${enquiryId}` : '/account'), 3000);
    return () => clearTimeout(timer);
  }, [state, router, enquiryId]);

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

  /* ── Default delivery address — like a saved Amazon address, prefilled
     from the profile but overridable per order. ───────────────────────── */
  const hasSavedAddress = !!user.address;
  const [useDifferentAddress, setUseDifferentAddress] = useState(false);

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

  function setField<K extends keyof QuickFormData>(key: K, value: QuickFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (state === 'error') { setState('idle'); setErrorMessage(''); }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (state === 'error') { setState('idle'); setErrorMessage(''); }
  }

  function validate(): string | null {
    if (!data.serviceType) return 'Please select a service type.';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMessage(validationError); setState('error'); return; }

    setState('loading');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name || user.email,
          email: user.email,
          phone: user.phone || null,
          country: user.country || null,
          service_type: data.serviceType,
          event_date: data.eventDate ? toDateInputValue(data.eventDate) : null,
          quantity_estimate: null,
          description: data.description,
          address: hasSavedAddress && !useDifferentAddress
            ? user.address
            : data.address.trim() || null,
          source: null,
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
      <div className="flex flex-col items-center py-16 text-center">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold"
          style={{ animation: 'successPop 0.4s ease' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
          </svg>
        </div>
        <h3 className="font-display text-display-md text-text-primary">
          Thank you, {(user.name || user.email).split(' ')[0]}
        </h3>
        <p className="mt-4 max-w-md font-body text-body-base text-text-muted">
          Your request is with us. We&apos;ll be in touch within 24 hours.
        </p>

        {enquiryId && (
          <div className="mt-8 w-full max-w-md rounded-2xl border border-accent-gold/40 bg-accent-gold/5 p-6 text-left">
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">Next step</p>
            <p className="mt-2 font-body text-body-base text-text-heading">
              Fill out your order form now so we can start on the design straight away — you don&apos;t need to wait for our reply.
            </p>
          </div>
        )}

        <Link
          href={enquiryId ? `/order-form/${enquiryId}` : '/account'}
          className="mt-8 inline-flex items-center gap-2 font-body text-label uppercase tracking-wider text-accent-gold link-underline"
        >
          {enquiryId ? 'Fill out order form now' : 'Go to your orders now'} &rarr;
        </Link>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Taking you there automatically&hellip;
        </p>
      </div>
    );
  }

  const descPlaceholder = SERVICE_PROMPTS[data.serviceType] ?? SERVICE_PROMPTS['default'];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* ── Ordering-as summary — contact details are already on file ──── */}
      <div className="flex items-center justify-between gap-4 border border-border bg-cat-surface px-5 py-3">
        <p className="font-body text-sm text-text-muted">
          Ordering as <span className="text-text-heading">{user.name || user.email}</span>
          {user.name && <span className="text-text-muted"> &middot; {user.email}</span>}
        </p>
        <Link
          href="/account/profile"
          className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-accent-gold underline hover:text-accent-gold-dark"
        >
          Edit details
        </Link>
      </div>

      {/* ── Portfolio cart context banner ───────────────────────────────── */}
      {cartItems.length > 0 && includeCartItems && (
        <div className="flex items-start justify-between gap-4 border border-accent-gold/40 bg-accent-gold/5 px-5 py-4 animate-fadeIn">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">
              Requesting a quote for {cartItems.length} item{cartItems.length === 1 ? '' : 's'} from your cart
            </p>
            <p className="mt-1.5 font-body text-sm text-text-muted">
              {cartItems.map((item) => item.title).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIncludeCartItems(false);
              if (derivedServiceType) setField('serviceType', '');
            }}
            className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-text-muted underline hover:text-text-heading"
          >
            Not about this
          </button>
        </div>
      )}

      {/* ── Service type — derived from the cart when every item agrees, otherwise pill chips ── */}
      <div>
        {derivedServiceType && !serviceOverride ? (
          <div className="flex items-center justify-between gap-4 border border-border bg-cat-surface px-4 py-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Service</p>
              <p className="mt-1 font-body text-cat-heading">{derivedServiceType}</p>
            </div>
            <button
              type="button"
              onClick={() => setServiceOverride(true)}
              className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-accent-gold underline hover:text-accent-gold-dark"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 font-body text-sm text-text-muted uppercase tracking-wider">
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

      {/* ── Date ─────────────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 font-body text-sm text-text-muted uppercase tracking-wider">
          Delivery Date
        </p>
        <DateField value={data.eventDate} onChange={(d) => setField('eventDate', d)} />
      </div>

      {/* ── Address — defaults to the saved profile address, like Amazon ──── */}
      <div>
        <p className="mb-3 font-body text-sm text-text-muted uppercase tracking-wider">
          Delivery or venue address
        </p>
        {hasSavedAddress && !useDifferentAddress ? (
          <div className="flex items-center justify-between gap-4 border border-border bg-cat-surface px-4 py-3">
            <p className="font-body text-cat-heading whitespace-pre-line">{user.address}</p>
            <button
              type="button"
              onClick={() => setUseDifferentAddress(true)}
              className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-accent-gold underline hover:text-accent-gold-dark"
            >
              Use a different address
            </button>
          </div>
        ) : (
          <>
            <AutoTextarea
              id="quote-address"
              name="address"
              label="Delivery or venue address"
              maxLength={500}
              value={data.address}
              onChange={handleChange}
              placeholder="Where should this be delivered, or where's the event taking place?"
            />
            {hasSavedAddress && (
              <button
                type="button"
                onClick={() => { setUseDifferentAddress(false); setField('address', ''); }}
                className="mt-2 font-mono text-[11px] uppercase tracking-wider text-accent-gold underline hover:text-accent-gold-dark"
              >
                Use my saved address instead
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <AutoTextarea
        id="quote-description"
        name="description"
        label="Anything else we should know"
        maxLength={800}
        value={data.description}
        onChange={handleChange}
        placeholder={descPlaceholder}
      />

      {/* ── Error message ────────────────────────────────────────────────── */}
      {state === 'error' && errorMessage && (
        <p className="text-sm text-accent-blush" role="alert">
          {errorMessage}
        </p>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={state === 'loading'}
          className={[
            'bg-accent-gold text-bg-primary px-8 py-3.5 font-body font-medium uppercase tracking-wider',
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
