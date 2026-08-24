'use client';

import { useState } from 'react';
import Link from 'next/link';
import OrderStepper, { type DisplayStage, deriveDisplayStage, deriveStageSince } from '@/components/ui/OrderStepper';
import OrderPaymentSection from '@/components/ui/OrderPaymentSection';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';
import { accentForServiceType } from '@/lib/order-category';
import { STATUS_LABELS, STATUS_COLORS, RAW_STATUS_LABELS } from '@/lib/order-status';
import type { Order, OrderStatusHistoryEntry, DesignRevision, Enquiry } from '@/types/database';

// A quote that hasn't been turned into an order yet — no production work,
// payment, or design review exists for it, so it only ever shows as 'placed'.
interface PlacedRow {
  kind: 'placed';
  id: string;
  enquiry: Enquiry;
}

interface OrderRowData {
  kind: 'order';
  id: string;
  order: Order;
  history: OrderStatusHistoryEntry[];
  latestRevision?: DesignRevision;
}

export type AccountRow = PlacedRow | OrderRowData;

function JobNumber({ id }: { id: string }) {
  return <p className="font-mono text-sm text-text-muted">Order #{id.slice(0, 8).toUpperCase()}</p>;
}

// Solid fill, not a faint tint — a low-opacity background on a stage like
// "Awaiting Your Review" (the one status that means "you have something to
// do") was easy to miss entirely against the rest of the row.
function StatusTag({ status }: { status: DisplayStage }) {
  const color = STATUS_COLORS[status];
  // The gold used for awaiting_review/payment is light enough that dark text
  // reads better on it than white — every other status color here is dark
  // enough for white text.
  const textColor = status === 'awaiting_review' || status === 'payment' ? '#1C2530' : '#FFFFFF';
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 font-mono text-sm font-semibold uppercase tracking-wider"
      style={{ color: textColor, backgroundColor: color }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function CancelEnquiryControl({ enquiryId, onCancelled }: { enquiryId: string; onCancelled: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    setCancelling(true);
    setError('');
    try {
      const res = await fetch(`/api/account/enquiries/${enquiryId}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Could not cancel this enquiry.');
      }
      onCancelled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel this enquiry.');
      setCancelling(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm uppercase tracking-widest text-[#7A4A44]">Cancel this enquiry?</span>
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="border border-[#7A4A44] px-4 py-2 font-mono text-sm uppercase tracking-widest text-[#7A4A44] transition-colors hover:bg-[#7A4A44] hover:text-white disabled:opacity-50"
        >
          {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={cancelling}
          className="font-mono text-sm uppercase tracking-widest text-text-muted hover:text-text-heading"
        >
          Never mind
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="font-mono text-sm uppercase tracking-widest text-[#7A4A44] underline transition-colors hover:text-[#5c3833]"
      >
        Cancel this enquiry
      </button>
      {error && <p className="mt-2 font-mono text-sm text-[#7A4A44]" role="alert">{error}</p>}
    </div>
  );
}

export default function CustomerOrderList({ rows: initialRows }: { rows: AccountRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [expandedId, setExpandedId] = useState<string | null>(initialRows.length === 1 ? initialRows[0].id : null);

  function markEnquiryCancelled(enquiryId: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.kind === 'placed' && row.enquiry.id === enquiryId
          ? { ...row, enquiry: { ...row.enquiry, status: 'cancelled' } }
          : row
      )
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {rows.map((row) => {
          const isOpen = expandedId === row.id;

          if (row.kind === 'placed') {
            const { enquiry } = row;
            const accent = accentForServiceType(enquiry.service_type);
            const isCancelled = enquiry.status === 'cancelled';
            const placedStage = deriveDisplayStage({ isPlaced: true, isCancelled });
            return (
              <div key={row.id} className="border border-border" style={{ borderLeft: `4px solid ${accent}` }}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : row.id)}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] ${isOpen ? 'bg-black/[0.02]' : ''}`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className={`shrink-0 font-mono text-sm text-text-muted transition-transform ${isOpen ? 'rotate-90 text-accent-gold' : ''}`}>▸</span>
                    <div className="min-w-0">
                      <JobNumber id={enquiry.id} />
                      <p className="mt-0.5 truncate font-display text-lg text-text-heading">{enquiry.service_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden font-mono text-sm text-text-muted sm:inline">
                      {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                    <StatusTag status={placedStage} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-dashed border-border px-5 py-6 sm:px-8">
                    <p className="font-body text-sm text-text-muted">
                      {isCancelled
                        ? 'You cancelled this enquiry — get in touch if you’d like to start a new one.'
                        : 'We’ve received this request — it’ll move to Order Confirmed once our studio begins work.'}
                    </p>

                    {enquiry.quantity_estimate && (
                      <p className="mt-4 font-mono text-sm uppercase tracking-widest text-text-muted">
                        Estimated quantity <span className="normal-case text-text-heading">{enquiry.quantity_estimate}</span>
                      </p>
                    )}

                    {enquiry.portfolio_items && enquiry.portfolio_items.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {enquiry.portfolio_items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/portfolio/${item.id}`}
                            className="border border-border px-3 py-1.5 font-mono text-sm text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {enquiry.description && (
                      <p className="mt-4 border-l-2 border-border pl-4 font-body text-sm text-text-muted">{enquiry.description}</p>
                    )}

                    <div className="mt-8">
                      <OrderStepper stage={placedStage} theme="light" since={enquiry.created_at} />
                    </div>

                    {!isCancelled && (
                      <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-border pt-6">
                        <Link
                          href={`/order-form/${enquiry.id}`}
                          className="inline-block border border-accent-gold px-5 py-2.5 font-body text-label uppercase tracking-wider text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary"
                        >
                          Order form
                        </Link>
                        <CancelEnquiryControl enquiryId={enquiry.id} onCancelled={() => markEnquiryCancelled(enquiry.id)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const { order, history, latestRevision } = row;
          const accent = accentForServiceType(order.service_type);
          const stage = deriveDisplayStage({
            isPlaced: false,
            orderStatus: order.status,
            paymentStatus: order.payment_status,
            hasPaymentAmount: order.payment_amount !== null && order.payment_amount > 0,
            latestRevisionStatus: latestRevision?.status,
          });
          const stageSince = deriveStageSince({
            orderCreatedAt: order.created_at,
            latestOrderStatusHistoryAt: history.length > 0 ? history[history.length - 1].created_at : null,
            latestRevisionUpdatedAt: latestRevision?.updated_at ?? null,
          });
          return (
            <div key={row.id} className="border border-border" style={{ borderLeft: `4px solid ${accent}` }}>
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : row.id)}
                className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] ${isOpen ? 'bg-black/[0.02]' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className={`shrink-0 font-mono text-sm text-text-muted transition-transform ${isOpen ? 'rotate-90 text-accent-gold' : ''}`}>▸</span>
                  <div className="min-w-0">
                    <JobNumber id={order.id} />
                    <p className="mt-0.5 truncate font-display text-lg text-text-heading">{order.service_type}</p>
                    {latestRevision && latestRevision.status === 'pending_review' && (
                      <p className="mt-0.5 font-mono text-sm uppercase tracking-widest text-accent-gold">Proof ready to review</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden font-mono text-sm text-text-muted sm:inline">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="hidden items-center gap-2 font-mono text-sm text-text-heading sm:flex">
                    {order.payment_status === 'paid' && order.payment_provider && (
                      <PaymentProviderIcon provider={order.payment_provider} />
                    )}
                    {order.payment_amount !== null ? `£${order.payment_amount.toFixed(2)}` : '—'}
                  </span>
                  <StatusTag status={stage} />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-dashed border-border px-5 py-6 sm:px-8">
                  {latestRevision && latestRevision.status === 'pending_review' && (
                    <Link
                      href={`/account/orders/${order.id}/review`}
                      className="flex items-center justify-between border border-accent-gold/40 bg-accent-gold/5 px-4 py-3 transition-colors hover:bg-accent-gold/10"
                    >
                      <span className="font-mono text-sm uppercase tracking-widest text-accent-gold">
                        Your design (v{latestRevision.version}) is ready to review
                      </span>
                      <span className="font-mono text-sm text-accent-gold">→</span>
                    </Link>
                  )}
                  {latestRevision && latestRevision.status === 'changes_requested' && (
                    <div className="border border-border bg-white/[0.02] px-4 py-3">
                      <span className="font-mono text-sm uppercase tracking-widest text-text-muted">
                        Changes requested on v{latestRevision.version} — the studio is working on a revised proof
                      </span>
                    </div>
                  )}
                  {latestRevision && latestRevision.status === 'approved' && (
                    <div className="border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                      <span className="font-mono text-sm uppercase tracking-widest text-emerald-600">
                        Design v{latestRevision.version} approved ✓
                      </span>
                    </div>
                  )}

                  {order.portfolio_items && order.portfolio_items.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.portfolio_items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/portfolio/${item.id}`}
                          className="border border-border px-3 py-1.5 font-mono text-sm text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {order.details && (
                    <p className="mt-4 border-l-2 border-border pl-4 font-body text-sm text-text-muted">{order.details}</p>
                  )}

                  <div>
                    <OrderPaymentSection order={order} latestRevision={latestRevision} />
                  </div>

                  <div className="mt-8">
                    <OrderStepper stage={stage} theme="light" since={stageSince} />
                  </div>

                  {stage === 'completed' && (
                    <div className="mt-8 border-t border-border pt-6">
                      <Link
                        href={`/account/quote?service=${encodeURIComponent(order.service_type)}&details=${encodeURIComponent(`Reordering — similar to a previous ${order.service_type} order.`)}`}
                        className="inline-block border border-accent-gold px-5 py-2.5 font-mono text-sm uppercase tracking-widest text-accent-gold transition-colors hover:bg-accent-gold hover:text-bg-primary"
                      >
                        Request similar
                      </Link>
                    </div>
                  )}

                  {order.enquiry_id && (
                    <div className="mt-8 border-t border-border pt-6">
                      <Link
                        href={`/order-form/${order.enquiry_id}`}
                        className="font-mono text-sm uppercase tracking-wider text-text-muted underline transition-colors hover:text-accent-gold"
                      >
                        View order form
                      </Link>
                    </div>
                  )}

                  {history.length > 0 && (
                    <div className="mt-8 border-t border-border pt-6">
                      <p className="mb-3 font-mono text-sm uppercase tracking-widest text-text-muted">History</p>
                      <ul className="space-y-4 border-l border-border pl-5">
                        {[...history].reverse().map((entry) => (
                          <li key={entry.id} className="relative">
                            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-accent-gold" aria-hidden="true" />
                            <p className="font-mono text-sm uppercase tracking-widest text-accent-gold">{RAW_STATUS_LABELS[entry.status]}</p>
                            <p className="font-mono text-sm text-text-muted">
                              {new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {entry.note && <p className="mt-1 font-body text-sm text-text-heading">{entry.note}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
