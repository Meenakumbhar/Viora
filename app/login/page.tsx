'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'That verification link is missing its token.',
  invalid_token: 'That verification link is invalid or has expired.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errCode = params.get('error');
    if (errCode && ERROR_MESSAGES[errCode]) {
      setError(ERROR_MESSAGES[errCode]);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 403) setNeedsVerification(true);
        throw new Error(json.error || 'Login failed.');
      }

      const role = json.data?.user?.role;
      const isStaff = role === 'designer' || role === 'employee' || role === 'proofreader';
      const fallback = isStaff ? '/staff' : '/account';
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      // Only honor `next` if it actually matches where this role belongs —
      // otherwise a customer link could strand a staff login on /account, or vice versa.
      const destination = next && next.startsWith(isStaff ? '/staff' : '/account') ? next : fallback;

      window.location.href = destination;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendState('sending');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResendState('sent');
    }
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide flex min-h-screen max-w-md flex-col justify-center py-24">
        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Welcome back</span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading">Log in</h1>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-border bg-bg-primary px-4 py-3 font-body text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block font-mono text-[11px] uppercase tracking-wider text-text-muted">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-border bg-bg-primary px-4 py-3 font-body text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>

          {error && (
            <div>
              <p className="font-body text-sm text-accent-blush" role="alert">{error}</p>
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState !== 'idle'}
                  className="mt-2 font-mono text-[11px] uppercase tracking-wider text-accent-gold underline disabled:opacity-50"
                >
                  {resendState === 'sent' ? 'Verification link sent' : resendState === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-gold px-8 py-3.5 font-body font-medium uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-hover disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 font-body text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-gold link-underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
