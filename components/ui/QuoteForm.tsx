'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  country: string;
  serviceType: string;
  eventDate: string;
  quantity: string;
  description: string;
  source: string;
}

const INITIAL_DATA: FormData = {
  name: '',
  email: '',
  country: '',
  serviceType: '',
  eventDate: '',
  quantity: '',
  description: '',
  source: '',
};

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Ireland',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Portugal',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'South Africa',
  'Nigeria',
  'Kenya',
  'India',
  'Pakistan',
  'Japan',
  'Singapore',
  'Hong Kong',
  'United Arab Emirates',
  'Saudi Arabia',
  'Brazil',
  'Mexico',
  'Argentina',
  'Colombia',
  'Philippines',
  'Malaysia',
];

const SERVICE_TYPES = [
  'Wedding & Events',
  'Funeral & Memorial',
  'Sports & Branding',
  'Graphic Design',
  'Print & Production',
  'Not sure',
];

const QUANTITIES = [
  '1–50',
  '51–200',
  '201–500',
  '500+',
  'Not yet decided',
];

const SOURCES = [
  'Google',
  'Instagram',
  'Referral',
  'Funeral Director',
  'Wedding Planner',
  'Other',
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const inputClasses =
  'w-full border border-border bg-cat-surface px-4 py-3 text-cat-heading transition-colors duration-300 focus:border-cat-accent focus:ring-1 focus:ring-cat-accent focus:outline-none placeholder:text-cat-muted';

const labelClasses = 'mb-2 block font-body text-body-base text-cat-heading';

export default function QuoteForm() {
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    if (state === 'error') {
      setState('idle');
      setErrorMessage('');
    }
  }

  function validate(): string | null {
    if (!data.name.trim()) return 'Please enter your name.';
    if (!data.email.trim()) return 'Please enter your email address.';
    if (!isValidEmail(data.email)) return 'Please enter a valid email address.';
    if (!data.country) return 'Please select your country.';
    if (!data.serviceType) return 'Please select a service type.';
    if (!data.quantity) return 'Please select an estimated quantity.';
    if (!data.description.trim()) return 'Please provide a brief description.';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      setState('error');
      return;
    }

    setState('loading');

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          country: data.country,
          service_type: data.serviceType,
          event_date: data.eventDate || null,
          quantity_estimate: data.quantity,
          description: data.description,
          source: data.source || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Something went wrong. Please try again.');
      }

      setState('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setState('error');
    }
  }

  // ─── SUCCESS STATE ───────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        {/* Checkmark icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 13L9 17L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent-gold"
            />
          </svg>
        </div>

        <h3 className="font-display text-display-md text-text-primary">
          Thank you, {data.name.split(' ')[0]}
        </h3>
        <p className="mt-4 max-w-md font-body text-body-base text-text-muted">
          We will be in touch within 24 hours.
        </p>
        <Link
          href="/portfolio"
          className="mt-8 inline-flex items-center gap-2 font-body text-label uppercase tracking-wider text-accent-gold link-underline"
        >
          Browse our portfolio &rarr;
        </Link>
      </div>
    );
  }

  // ─── FORM ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Row 1: Name / Email */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="quote-name" className={labelClasses}>
            Name <span className="text-accent-gold">*</span>
          </label>
          <input
            id="quote-name"
            name="name"
            type="text"
            value={data.name}
            onChange={handleChange}
            required
            className={inputClasses}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="quote-email" className={labelClasses}>
            Email <span className="text-accent-gold">*</span>
          </label>
          <input
            id="quote-email"
            name="email"
            type="email"
            value={data.email}
            onChange={handleChange}
            required
            className={inputClasses}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Row 2: Country / Service type */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="quote-country" className={labelClasses}>
            Country <span className="text-accent-gold">*</span>
          </label>
          <select
            id="quote-country"
            name="country"
            value={data.country}
            onChange={handleChange}
            required
            className={inputClasses}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quote-service" className={labelClasses}>
            Service type <span className="text-accent-gold">*</span>
          </label>
          <select
            id="quote-service"
            name="serviceType"
            value={data.serviceType}
            onChange={handleChange}
            required
            className={inputClasses}
          >
            <option value="">Select service</option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Event date / Quantity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="quote-date" className={labelClasses}>
            Event or delivery date
          </label>
          <input
            id="quote-date"
            name="eventDate"
            type="date"
            value={data.eventDate}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="quote-quantity" className={labelClasses}>
            Estimated quantity <span className="text-accent-gold">*</span>
          </label>
          <select
            id="quote-quantity"
            name="quantity"
            value={data.quantity}
            onChange={handleChange}
            required
            className={inputClasses}
          >
            <option value="">Select quantity</option>
            {QUANTITIES.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Description */}
      <div>
        <label htmlFor="quote-description" className={labelClasses}>
          Brief description <span className="text-accent-gold">*</span>
        </label>
        <textarea
          id="quote-description"
          name="description"
          value={data.description}
          onChange={handleChange}
          required
          rows={4}
          className={inputClasses}
          placeholder="Tell us about your project, style preferences, and any key details."
        />
      </div>

      {/* Row 5: How did you hear */}
      <div>
        <label htmlFor="quote-source" className={labelClasses}>
          How did you hear about us?
        </label>
        <select
          id="quote-source"
          name="source"
          value={data.source}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="">Select an option</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {state === 'error' && errorMessage && (
        <p className="text-sm text-accent-blush" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={state === 'loading'}
        className={[
          'w-full bg-accent-gold py-4 font-body font-medium uppercase tracking-wider text-bg-primary',
          'transition-all duration-300 hover:bg-accent-gold-dark',
          'focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          'disabled:opacity-50',
          state === 'loading' ? 'animate-pulse' : '',
        ].join(' ')}
      >
        {state === 'loading' ? 'Sending...' : 'Get a Quote'}
      </button>

      {/* Privacy note */}
      <p className="text-center text-sm text-text-muted">
        Your details are safe. We never share your information with third parties.
      </p>
    </form>
  );
}
