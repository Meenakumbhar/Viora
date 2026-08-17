'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not reset your password.');
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-display-md text-text-heading">Invalid reset link</h1>
        <p className="mt-4 font-body text-body-base text-text-muted">
          This password reset link is missing its token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wider text-accent-gold link-underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold"
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="m3 6 9 6 9-6M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
          </svg>
        </div>
        <h1 className="font-display text-display-md text-text-heading">Password reset</h1>
        <p className="mt-4 font-body text-body-base text-text-muted">
          Your password has been changed. You&apos;ve been logged out of every other session for your security.
        </p>
        <Link href="/login" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-wider text-accent-gold link-underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <span className="font-mono text-label uppercase tracking-wider text-accent-gold">Choose a new password</span>
      <h1 className="mt-3 font-display text-display-lg text-text-heading">Reset password</h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
        <div>
          <label htmlFor="reset-password" className="block font-mono text-[11px] uppercase tracking-wider text-text-muted">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-border bg-bg-primary px-4 py-3 font-body text-text-heading outline-none transition-colors focus:border-accent-gold"
          />
          <p className="mt-1.5 font-mono text-[11px] text-text-muted">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className="block font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Confirm new password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </>
  );
}
