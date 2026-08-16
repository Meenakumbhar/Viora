'use client';

import { useState } from 'react';
import type { PublicUser } from '@/types/database';
import { patchJson } from '@/lib/api-client';

interface ProfileCardProps {
  user: PublicUser;
}

export default function ProfileCard({ user: initialUser }: ProfileCardProps) {
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [country, setCountry] = useState(user.country ?? '');
  const [address, setAddress] = useState(user.address ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startEditing() {
    setName(user.name ?? '');
    setPhone(user.phone ?? '');
    setCountry(user.country ?? '');
    setAddress(user.address ?? '');
    setError('');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await patchJson<PublicUser>('/api/account/me', {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        country: country.trim() || undefined,
        address: address.trim() || undefined,
      });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details.');
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="border border-accent-gold/40 p-6 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-heading">Editing your details</p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="profile-name" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Phone
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>
          <div>
            <label htmlFor="profile-country" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Country
            </label>
            <input
              id="profile-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1.5 w-full border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>
          <div>
            <label htmlFor="profile-address" className="block font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Default delivery address
            </label>
            <textarea
              id="profile-address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Used to prefill new quotes — you can still enter a different address per order."
              className="mt-1.5 w-full resize-none border border-border bg-bg-primary px-3 py-2.5 font-body text-base text-text-heading outline-none transition-colors focus:border-accent-gold"
            />
          </div>

          {error && <p className="font-body text-sm text-accent-blush" role="alert">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-accent-gold px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text-heading"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    { label: 'Name', value: user.name || '—' },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phone || '—' },
    { label: 'Country', value: user.country || '—' },
    { label: 'Default address', value: user.address || '—' },
    {
      label: 'Member since',
      value: new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    },
  ];

  return (
    <div className="border border-border p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-heading">Account spec</p>
        <button
          type="button"
          onClick={startEditing}
          className="font-mono text-xs uppercase tracking-widest text-accent-gold link-underline"
        >
          Edit
        </button>
      </div>

      <dl className="mt-5 divide-y divide-dashed divide-border">
        {fields.map((field) => (
          <div key={field.label} className="grid grid-cols-[8rem_1fr] gap-4 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[9rem_1fr]">
            <dt className="font-mono text-[11px] uppercase tracking-widest text-text-muted">{field.label}</dt>
            <dd className="truncate font-body text-base text-text-heading">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
