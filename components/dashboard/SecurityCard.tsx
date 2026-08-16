'use client';

import { useState } from 'react';

export default function SecurityCard() {
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [revoking, setRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState('');

  async function handleChangePassword() {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not change your password.');
      }
      setMessage(json.message || 'Password changed.');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeOtherSessions() {
    setRevoking(true);
    setRevokeMessage('');
    try {
      const res = await fetch('/api/auth/revoke-other-sessions', { method: 'POST' });
      const json = await res.json();
      setRevokeMessage(json.success ? (json.message ?? 'Done.') : (json.error ?? 'Something went wrong.'));
    } catch {
      setRevokeMessage('Something went wrong.');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="border border-border p-6 sm:p-7">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-heading">Security</p>

      {message && (
        <p className="mt-4 border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 font-body text-sm text-emerald-700">{message}</p>
      )}

      <div className="mt-5 border-t border-dashed border-border pt-5">
        {changingPassword ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
              />
              <p className="mt-1.5 font-mono text-[10px] text-text-muted">At least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
              />
            </div>

            {error && <p className="font-body text-sm text-accent-blush" role="alert">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={saving}
                className="bg-accent-gold px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Change password'}
              </button>
              <button
                type="button"
                onClick={() => setChangingPassword(false)}
                disabled={saving}
                className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text-heading"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="font-body text-base text-text-heading">Password</p>
            <button
              type="button"
              onClick={() => setChangingPassword(true)}
              className="font-mono text-xs uppercase tracking-widest text-accent-gold link-underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-dashed border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-base text-text-heading">Other devices</p>
            <p className="mt-1 font-body text-sm text-text-muted">Sign out everywhere except this browser.</p>
          </div>
          <button
            type="button"
            onClick={handleRevokeOtherSessions}
            disabled={revoking}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-text-heading transition-colors hover:border-accent-gold hover:text-accent-gold disabled:opacity-50"
          >
            {revoking ? 'Signing out…' : 'Sign out other devices'}
          </button>
        </div>
        {revokeMessage && <p className="mt-3 font-mono text-xs text-text-muted">{revokeMessage}</p>}
      </div>
    </div>
  );
}
