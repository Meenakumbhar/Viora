'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OrderStepper from '@/components/admin/OrderStepper';
import type { Order, OrderStatus, OrderWithHistory } from '@/types/database';

const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed'];

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

// Mirrors the service/quantity options on the public quote form (components/ui/QuoteForm.tsx)
// so orders created here — or converted from an enquiry — use the same vocabulary.
const SERVICE_TYPES = ['Wedding & Events', 'Funeral & Memorial', 'Sports & Branding', 'Graphic Design', 'Print & Production', 'Not sure'];
const QUANTITY_ESTIMATES = ['1–50', '51–200', '201–500', '500+', 'Not yet decided'];

interface CreateFormState {
  customer_name: string;
  customer_email: string;
  service_type: string;
  event_date: string;
  quantity_estimate: string;
  details: string;
}

function emptyForm(): CreateFormState {
  return { customer_name: '', customer_email: '', service_type: '', event_date: '', quantity_estimate: '', details: '' };
}

export default function OrdersAdminManager({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [form, setForm] = useState<CreateFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [detailOrder, setDetailOrder] = useState<OrderWithHistory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('pending');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [detailError, setDetailError] = useState('');

  const visibleOrders = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter]
  );

  async function openDetail(order: Order) {
    setDetailLoading(true);
    setDetailError('');
    setNote('');
    setNextStatus(order.status);
    setDetailOrder({ ...order, history: [] });

    try {
      const response = await fetch(`/api/orders/${order.id}`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to load order.');
      }
      setDetailOrder(json.data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to load order.');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOrder(null);
    setDetailError('');
    setNote('');
  }

  async function handleStatusUpdate() {
    if (!detailOrder) return;
    setUpdating(true);
    setDetailError('');

    try {
      const response = await fetch(`/api/orders/${detailOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, note: note.trim() || undefined }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to update order.');
      }

      const updated: OrderWithHistory = json.data;
      setDetailOrder(updated);
      setOrders((current) => current.map((o) => (o.id === updated.id ? updated : o)));
      setNote('');
      router.refresh();
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Failed to update order.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleCreate() {
    if (!form) return;
    if (!form.customer_name.trim() || !form.customer_email.trim() || !form.service_type.trim()) {
      setError('Customer name, email, and service type are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          service_type: form.service_type,
          event_date: form.event_date || null,
          quantity_estimate: form.quantity_estimate || null,
          details: form.details || null,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to create order.');
      }

      setOrders((current) => [json.data, ...current]);
      setForm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order.');
    } finally {
      setSaving(false);
    }
  }

  const countFor = (status: OrderStatus) => orders.filter((o) => o.status === status).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
              statusFilter === 'all' ? 'border-[#C6A85C] text-[#C6A85C]' : 'border-white/15 text-white/40 hover:text-white/70'
            }`}
          >
            All ({orders.length})
          </button>
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                statusFilter === status ? 'border-[#C6A85C] text-[#C6A85C]' : 'border-white/15 text-white/40 hover:text-white/70'
              }`}
            >
              {STATUS_LABELS[status]} ({countFor(status)})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm(emptyForm())}
          className="border border-[#C6A85C] bg-[#C6A85C] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90"
        >
          + New order
        </button>
      </div>

      {error && !form && (
        <p className="mb-4 font-mono text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="border border-white/10">
        {visibleOrders.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-white/30">No orders in this category yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Customer</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Item ordered</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Service</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden lg:table-cell">Placed</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Status</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/40">Tracker</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order, i) => (
                <tr key={order.id} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                  <td className="px-4 py-3">
                    <p className="font-body text-sm text-white/80">{order.customer_name}</p>
                    <p className="font-mono text-[10px] text-white/30">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {order.portfolio_items && order.portfolio_items.length > 0 ? (
                      <p
                        className="truncate font-body text-sm text-[#C6A85C]"
                        title={order.portfolio_items.map((i) => i.title).join(', ')}
                      >
                        {order.portfolio_items.map((i) => i.title).join(', ')}
                      </p>
                    ) : (
                      <span className="font-mono text-xs text-white/25">— general enquiry —</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-xs text-white/50">{order.service_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="font-mono text-[10px] text-white/30">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(order)}
                      className="font-mono text-[10px] uppercase tracking-wider text-[#C6A85C] hover:text-white"
                    >
                      View tracker →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create order panel */}
      {form && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setForm(null);
          }}
        >
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-white/10 bg-[#151C24] p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-light">New order</h2>
              <button type="button" onClick={() => setForm(null)} className="font-mono text-xl text-white/40 hover:text-white">
                &times;
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Customer name</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Customer email</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                  className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Service type</label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="mt-2 w-full border border-white/15 bg-[#151C24] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                >
                  <option value="">Select a service…</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Event / delivery date (optional)</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Estimated quantity (optional)</label>
                  <select
                    value={form.quantity_estimate}
                    onChange={(e) => setForm({ ...form, quantity_estimate: e.target.value })}
                    className="mt-2 w-full border border-white/15 bg-[#151C24] px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                  >
                    <option value="">Not specified</option>
                    {QUANTITY_ESTIMATES.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-white/40">Details (optional)</label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  rows={3}
                  className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
                />
              </div>

              <p className="font-mono text-[10px] text-white/30">
                The customer will get an email confirming the order is placed (once Resend is configured).
              </p>

              {error && (
                <p className="font-mono text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving}
                  className="border border-[#C6A85C] bg-[#C6A85C] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Creating…' : 'Create order'}
                </button>
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="font-mono text-xs uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order detail / tracker panel */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetail();
          }}
        >
          <div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#151C24] p-8">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Order #{detailOrder.id.slice(0, 8).toUpperCase()}
                </p>
                <h2 className="mt-1 font-display text-2xl font-light">{detailOrder.customer_name}</h2>
                <p className="font-mono text-xs text-white/40">{detailOrder.customer_email} · {detailOrder.service_type}</p>
              </div>
              <button type="button" onClick={closeDetail} className="font-mono text-xl text-white/40 hover:text-white">
                &times;
              </button>
            </div>

            {(detailOrder.event_date || detailOrder.quantity_estimate) && (
              <div className="mt-4 flex flex-wrap gap-6">
                {detailOrder.event_date && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Event / delivery date</p>
                    <p className="mt-1 font-body text-sm text-white/70">
                      {new Date(detailOrder.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {detailOrder.quantity_estimate && (
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">Estimated quantity</p>
                    <p className="mt-1 font-body text-sm text-white/70">{detailOrder.quantity_estimate}</p>
                  </div>
                )}
              </div>
            )}

            {detailOrder.details && (
              <p className="mt-4 border-l-2 border-white/10 pl-4 font-body text-sm text-white/60">{detailOrder.details}</p>
            )}

            {detailOrder.portfolio_items && detailOrder.portfolio_items.length > 0 && (
              <div className="mt-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-white/30">
                  Referencing {detailOrder.portfolio_items.length} portfolio item{detailOrder.portfolio_items.length === 1 ? '' : 's'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailOrder.portfolio_items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/portfolio/${item.id}`}
                      target="_blank"
                      className="border border-white/15 px-3 py-1.5 font-mono text-[10px] text-white/70 transition-colors hover:border-[#C6A85C] hover:text-[#C6A85C]"
                    >
                      {item.title} <span className="text-white/30">· {item.category}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Visual tracker */}
            <div className="mt-8">
              <OrderStepper status={detailOrder.status} />
            </div>

            {/* Timeline */}
            <div className="mt-10">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/40">History</h3>
              {detailLoading ? (
                <p className="font-mono text-xs text-white/30">Loading…</p>
              ) : detailOrder.history.length === 0 ? (
                <p className="font-mono text-xs text-white/30">No history yet.</p>
              ) : (
                <ul className="space-y-4 border-l border-white/10 pl-5">
                  {[...detailOrder.history].reverse().map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-[#C6A85C]" aria-hidden="true" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#C6A85C]">{STATUS_LABELS[entry.status]}</p>
                      <p className="font-mono text-[10px] text-white/30">
                        {new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {entry.note && <p className="mt-1 font-body text-sm text-white/70">{entry.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Status change form */}
            <div className="mt-10 border-t border-white/10 pt-6">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Update status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setNextStatus(status)}
                    className={`border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      nextStatus === status ? 'border-[#C6A85C] bg-[#C6A85C] text-[#0E1117]' : 'border-white/15 text-white/50 hover:border-white/40'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              <label className="mt-4 block font-mono text-[10px] uppercase tracking-widest text-white/40">
                Note to customer (optional — included in the email)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Your proof is ready for review, check your inbox shortly."
                className="mt-2 w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
              />

              {detailError && (
                <p className="mt-3 font-mono text-xs text-red-400" role="alert">
                  {detailError}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updating || nextStatus === detailOrder.status && !note.trim()}
                  className="border border-[#C6A85C] bg-[#C6A85C] px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {updating ? 'Updating…' : 'Update & notify customer'}
                </button>
                {nextStatus === detailOrder.status && !note.trim() && (
                  <span className="font-mono text-[10px] text-white/30">Pick a different status or add a note to send an update.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
