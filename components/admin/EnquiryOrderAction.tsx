'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Enquiry, Order, OrderStatus } from '@/types/database';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-amber-400 border-amber-500/30',
  in_progress: 'text-blue-400 border-blue-500/30',
  completed: 'text-emerald-400 border-emerald-500/30',
};

export default function EnquiryOrderAction({ enquiry, existingOrder }: { enquiry: Enquiry; existingOrder?: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (existingOrder) {
    return (
      <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLORS[existingOrder.status]}`}>
        Order: {STATUS_LABELS[existingOrder.status]}
      </span>
    );
  }

  async function handleConvert() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: enquiry.name,
          customer_email: enquiry.email,
          service_type: enquiry.service_type,
          event_date: enquiry.event_date,
          quantity_estimate: enquiry.quantity_estimate,
          details: enquiry.description,
          enquiry_id: enquiry.id,
          portfolio_items: enquiry.portfolio_items,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to create order.');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order.');
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleConvert}
        disabled={loading}
        className="border border-[#C6A85C] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#C6A85C] transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {loading ? 'Creating…' : 'Turn into order'}
      </button>
      {error && <p className="mt-1 font-mono text-[9px] text-red-400">{error}</p>}
    </div>
  );
}
