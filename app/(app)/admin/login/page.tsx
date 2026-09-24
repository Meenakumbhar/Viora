'use client';

import { useState, type FormEvent } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Incorrect password.');
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/admin';
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0E1117',
        color: '#F0EDE8',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Memories in Prints
        </p>
        <h1 className="mt-2 font-display text-3xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Admin sign in
        </h1>

        <label className="mt-8 block font-mono text-[10px] uppercase tracking-widest text-white/40">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          required
          className="mt-2 w-full border border-white/15 bg-transparent px-4 py-3 font-body text-sm text-white outline-none transition-colors focus:border-[#C6A85C]"
        />

        {error && (
          <p className="mt-3 font-mono text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 w-full border border-[#C6A85C] bg-[#C6A85C] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
