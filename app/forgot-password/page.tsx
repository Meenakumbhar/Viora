'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Something went wrong.');
      }

      setMessage(json.message || 'If an account exists for that email, we\'ve sent a link to reset your password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <main id="main-content" className="min-h-screen bg-bg-primary">
        <div className="container-wide flex min-h-screen max-w-md flex-col justify-center py-24 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold"
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="m3 6 9 6 9-6M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
            </svg>
          </div>
          <h1 className="font-display text-display-md text-text-heading">Check your email</h1>
          <p className="mt-4 font-body text-body-base text-text-muted">{message}</p>
          <Link href="/login" className="mt-8 font-mono text-[11px] uppercase tracking-wider text-accent-gold link-underline">
            Back to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide flex min-h-screen max-w-md flex-col justify-center py-24">
        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Reset your password</span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading">Forgot password</h1>
        <p className="mt-4 font-body text-body-base text-text-muted">
          Enter the email address on your account and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="forgot-email" className="block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-border bg-bg-primary px-4 py-3 font-body text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-accent-blush" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gold px-8 py-3.5 font-body font-medium uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-hover disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-8 font-body text-sm text-text-muted">
          Remembered your password?{' '}
          <Link href="/login" className="text-accent-gold link-underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
