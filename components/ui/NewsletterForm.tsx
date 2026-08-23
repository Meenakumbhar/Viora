'use client';

import { useState, type FormEvent } from 'react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      setState('error');
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      setState('error');
      return;
    }

    setState('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setState('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <p className="font-display text-display-md text-text-primary">
          Thank you for subscribing.
        </p>
      </div>
    );
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:gap-0"
        noValidate
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === 'error') setState('idle');
          }}
          placeholder="Your email address"
          required
          className="w-full border border-border bg-bg-primary px-6 py-3 text-text-primary placeholder:text-text-muted transition-colors duration-300 focus:border-accent-gold focus:ring-1 focus:ring-accent-gold focus:outline-none sm:flex-1"
          disabled={state === 'loading'}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="bg-bg-primary border border-border border-l-0 px-8 py-3 font-body uppercase tracking-wider text-text-primary transition-colors duration-300 hover:bg-bg-secondary disabled:opacity-50 sm:border-l-0 max-sm:border-t-0"
        >
          {state === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {/* Error message */}
      {state === 'error' && errorMessage && (
        <p className="mt-3 text-base text-accent-blush" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Privacy note */}
      <p className="mt-4 text-base text-text-muted">
        No spam. Unsubscribe any time.
      </p>
    </div>
  );
}
