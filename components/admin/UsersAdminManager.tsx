'use client';

import { useMemo, useState } from 'react';
import { USER_ROLES } from '@/types/database';
import type { PublicUser, UserRole } from '@/types/database';

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  designer: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  proofreader: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  employee: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  user: 'bg-white/10 text-white/50 border-white/20',
};

type VerifiedFilter = 'all' | 'verified' | 'unverified';
type RoleFilter = 'all' | UserRole;

const TOGGLE_BASE = 'border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors';
const TOGGLE_ACTIVE = 'border-[#C6A85C] text-[#C6A85C]';
const TOGGLE_INACTIVE = 'border-white/15 text-white/40 hover:text-white/70';

interface UsersAdminManagerProps {
  initialUsers: PublicUser[];
}

// Roles are assigned directly in the database, not from this UI — this is a
// read-only view so the team can see who has which role.
export default function UsersAdminManager({ initialUsers }: UsersAdminManagerProps) {
  const [nameQuery, setNameQuery] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');

  const filtered = useMemo(() => {
    const query = nameQuery.trim().toLowerCase();
    const from = joinedFrom ? new Date(joinedFrom) : null;
    // Include the whole "to" day, not just its midnight.
    const to = joinedTo ? new Date(new Date(joinedTo).getTime() + 24 * 60 * 60 * 1000 - 1) : null;

    return initialUsers.filter((user) => {
      if (query && !(user.name ?? '').toLowerCase().includes(query)) return false;
      if (verifiedFilter === 'verified' && !user.email_verified) return false;
      if (verifiedFilter === 'unverified' && user.email_verified) return false;
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      const joinedAt = new Date(user.created_at);
      if (from && joinedAt < from) return false;
      if (to && joinedAt > to) return false;

      return true;
    });
  }, [initialUsers, nameQuery, verifiedFilter, roleFilter, joinedFrom, joinedTo]);

  const hasActiveFilters = nameQuery || verifiedFilter !== 'all' || roleFilter !== 'all' || joinedFrom || joinedTo;

  function clearFilters() {
    setNameQuery('');
    setVerifiedFilter('all');
    setRoleFilter('all');
    setJoinedFrom('');
    setJoinedTo('');
  }

  if (initialUsers.length === 0) {
    return <p className="font-mono text-xs text-white/30">No accounts yet.</p>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Name</label>
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Search by name…"
              className="mt-2 w-48 border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Joined from</label>
            <input
              type="date"
              value={joinedFrom}
              onChange={(e) => setJoinedFrom(e.target.value)}
              className="mt-2 border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Joined to</label>
            <input
              type="date"
              value={joinedTo}
              onChange={(e) => setJoinedTo(e.target.value)}
              className="mt-2 border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-white/30">Verified:</span>
          {(['all', 'verified', 'unverified'] as VerifiedFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setVerifiedFilter(option)}
              className={`${TOGGLE_BASE} ${verifiedFilter === option ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-white/30">Role:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`${TOGGLE_BASE} ${roleFilter === 'all' ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}`}
          >
            all
          </button>
          {USER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`${TOGGLE_BASE} ${roleFilter === role ? TOGGLE_ACTIVE : TOGGLE_INACTIVE}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
        Showing {filtered.length} of {initialUsers.length}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-white/10 p-10 text-center font-mono text-xs text-white/30">
          No accounts match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Verified</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Joined</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-body text-sm text-white/90">{user.email}</td>
                  <td className="px-4 py-3 font-body text-sm text-white/60">{user.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        user.email_verified
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          : 'border-white/20 bg-white/10 text-white/40'
                      }`}
                    >
                      {user.email_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/40">
                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${ROLE_COLORS[user.role]}`}
                    >
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
