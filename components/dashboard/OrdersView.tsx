'use client';

import { useMemo, useState } from 'react';
import CustomerOrderList, { type AccountRow } from './CustomerOrderList';

type Filter = 'all' | 'placed' | 'pending' | 'in_progress' | 'proof_due' | 'payment_due';

function matchesFilter(row: AccountRow, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'placed') return row.kind === 'placed';
  if (row.kind === 'placed') return false;
  if (filter === 'proof_due') return row.latestRevision?.status === 'pending_review';
  if (filter === 'payment_due') return row.order.payment_status !== 'paid' && (row.order.payment_amount ?? 0) > 0;
  return row.order.status === filter;
}

function matchesSearch(row: AccountRow, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const id = row.id.toLowerCase();
  const service = row.kind === 'placed' ? row.enquiry.service_type : row.order.service_type;
  return id.includes(q) || service.toLowerCase().includes(q);
}

// Expects `rows` to already exclude completed jobs — those live on their own
// page (see the "Completed" link in the left account nav), so this view and
// its filters only ever deal with what still needs attention.
export default function OrdersView({ rows }: { rows: AccountRow[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      placed: 0,
      pending: 0,
      in_progress: 0,
      proof_due: 0,
      payment_due: 0,
    };
    for (const row of rows) {
      if (row.kind === 'placed') {
        c.placed += 1;
        continue;
      }
      if (row.order.status === 'pending' || row.order.status === 'in_progress') {
        c[row.order.status] += 1;
      }
      if (row.latestRevision?.status === 'pending_review') c.proof_due += 1;
      if (row.order.payment_status !== 'paid' && (row.order.payment_amount ?? 0) > 0) c.payment_due += 1;
    }
    return c;
  }, [rows]);

  const allChips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'placed', label: 'Placed' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In production' },
    { value: 'proof_due', label: 'Proof due' },
    { value: 'payment_due', label: 'Payment due' },
  ];
  const chips = allChips.filter((chip) => chip.value === 'all' || counts[chip.value] > 0);

  const filtered = rows.filter((row) => matchesFilter(row, filter) && matchesSearch(row, search));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = filter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilter(chip.value)}
              className={`border px-3 py-1.5 font-mono text-sm uppercase tracking-wider transition-colors ${
                active
                  ? 'border-accent-gold bg-accent-gold text-bg-primary'
                  : 'border-border text-text-muted hover:border-accent-gold hover:text-accent-gold'
              }`}
            >
              {chip.label} <span className={active ? 'opacity-80' : 'opacity-50'}>{counts[chip.value]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by job number or service…"
          className="w-full max-w-sm border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-heading outline-none placeholder:text-text-muted focus:border-accent-gold sm:max-w-xs"
        />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <p className="border border-dashed border-border px-5 py-8 text-center font-body text-sm text-text-muted">
            No jobs match this view.
          </p>
        ) : (
          <CustomerOrderList rows={filtered} />
        )}
      </div>
    </div>
  );
}
