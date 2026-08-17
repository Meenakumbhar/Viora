'use client';

import { useState } from 'react';
import Link from 'next/link';
import OrderStepper, { type DisplayStage } from '@/components/ui/OrderStepper';
import OrderPaymentSection from '@/components/ui/OrderPaymentSection';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';
import { accentForServiceType } from '@/lib/order-category';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/order-status';
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
  return <p className="font-mono text-xs text-text-muted">JOB #{id.slice(0, 8).toUpperCase()}</p>;
}

function StatusTag({ status }: { status: DisplayStage }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center border px-2.5 py-1 font-mono text-xs uppercase tracking-wider"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}0D` }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function CustomerOrderList({ rows }: { rows: AccountRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(rows.length === 1 ? rows[0].id : null);

  return (
    <div>
      <div className="space-y-3">
        {rows.map((row) => {
          const isOpen = expandedId === row.id;

          if (row.kind === 'placed') {
            const { enquiry } = row;
            const accent = accentForServiceType(enquiry.service_type);
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
                    <span className="hidden font-mono text-xs text-text-muted sm:inline">
                      {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                    <StatusTag status="placed" />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-dashed border-border px-5 py-6 sm:px-8">
                    <p className="font-body text-base text-text-muted">
                      We&apos;ve received this request — it&apos;ll move to Pending once our studio begins work.
                    </p>

                    {enquiry.quantity_estimate && (
                      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-text-muted">
                        Estimated quantity <span className="normal-case text-text-heading">{enquiry.quantity_estimate}</span>
                      </p>
                    )}

                    {enquiry.portfolio_items && enquiry.portfolio_items.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {enquiry.portfolio_items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/portfolio/${item.id}`}
                            className="border border-border px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                          >
                            {item.title}
                          </Link>
                        ))}
                      </div>
                    )}

                    {enquiry.description && (
                      <p className="mt-4 border-l-2 border-border pl-4 font-body text-base text-text-muted">{enquiry.description}</p>
                    )}

                    <div className="mt-8">
                      <OrderStepper status="placed" theme="light" />
                    </div>

                    <div className="mt-8 border-t border-border pt-6">
                      <Link
                        href={`/order-form/${enquiry.id}`}
                        className="inline-block border border-accent-gold px-5 py-2.5 font-body text-label uppercase tracking-wider text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary"
                      >
                        Order form
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const { order, history, latestRevision } = row;
          const accent = accentForServiceType(order.service_type);
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
                      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-accent-gold">Proof ready to review</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden font-mono text-xs text-text-muted sm:inline">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  <span className="hidden items-center gap-2 font-mono text-sm text-text-heading sm:flex">
                    {order.payment_status === 'paid' && order.payment_provider && (
                      <PaymentProviderIcon provider={order.payment_provider} />
                    )}
                    {order.payment_amount !== null ? `£${order.payment_amount.toFixed(2)}` : '—'}
                  </span>
                  <StatusTag status={order.status} />
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
                          className="border border-border px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {order.details && (
                    <p className="mt-4 border-l-2 border-border pl-4 font-body text-base text-text-muted">{order.details}</p>
                  )}

                  <div>
                    <OrderPaymentSection order={order} />
                  </div>

                  <div className="mt-8">
                    <OrderStepper status={order.status} theme="light" />
                  </div>

                  {order.status === 'completed' && (
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
                        className="font-mono text-xs uppercase tracking-wider text-text-muted underline transition-colors hover:text-accent-gold"
                      >
                        View order form
                      </Link>
                    </div>
                  )}

                  {history.length > 0 && (
                    <div className="mt-8 border-t border-border pt-6">
                      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-muted">History</p>
                      <ul className="space-y-4 border-l border-border pl-5">
                        {[...history].reverse().map((entry) => (
                          <li key={entry.id} className="relative">
                            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-accent-gold" aria-hidden="true" />
                            <p className="font-mono text-xs uppercase tracking-widest text-accent-gold">{STATUS_LABELS[entry.status]}</p>
                            <p className="font-mono text-xs text-text-muted">
                              {new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {entry.note && <p className="mt-1 font-body text-base text-text-heading">{entry.note}</p>}
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
