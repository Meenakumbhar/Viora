'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import OrderStepper, { type DisplayStage } from '@/components/ui/OrderStepper';
import OrderPaymentSection from '@/components/ui/OrderPaymentSection';
import type { Order, OrderStatus, OrderStatusHistoryEntry, DesignRevision, Enquiry } from '@/types/database';

const STATUS_LABELS: Record<DisplayStage, string> = {
  placed: 'Placed',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<DisplayStage, string> = {
  placed: 'text-violet-600 border-violet-500/30',
  pending: 'text-amber-600 border-amber-500/30',
  in_progress: 'text-blue-600 border-blue-500/30',
  completed: 'text-emerald-600 border-emerald-500/30',
};

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

export default function CustomerOrderList({ rows }: { rows: AccountRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(rows.length === 1 ? rows[0].id : null);

  return (
    <div className="mt-8 border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-black/[0.02]">
            <th className="w-8 px-2 py-3" />
            <th className="px-3 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Order</th>
            <th className="px-3 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted hidden md:table-cell">Service</th>
            <th className="px-3 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted hidden lg:table-cell">Placed</th>
            <th className="px-3 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Status</th>
            <th className="px-3 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expandedId === row.id;

            if (row.kind === 'placed') {
              const { enquiry } = row;
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpandedId(isOpen ? null : row.id)}
                    className={`cursor-pointer border-b border-border transition-colors hover:bg-black/[0.02] ${isOpen ? 'bg-black/[0.02]' : ''}`}
                  >
                    <td className="px-2 py-2.5 text-center">
                      <span className={`inline-block font-mono text-xs text-text-muted transition-transform ${isOpen ? 'rotate-90 text-accent-gold' : ''}`}>▸</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-mono text-[10px] text-text-muted">#{enquiry.id.slice(0, 8).toUpperCase()}</p>
                    </td>
                    <td className="hidden max-w-[220px] truncate px-3 py-2.5 font-body text-sm text-text-heading md:table-cell">{enquiry.service_type}</td>
                    <td className="hidden px-3 py-2.5 font-mono text-[10px] text-text-muted lg:table-cell">
                      {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLORS.placed}`}>
                        {STATUS_LABELS.placed}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-text-muted">—</td>
                  </tr>

                  {isOpen && (
                    <tr className="border-b border-border bg-black/[0.015]">
                      <td colSpan={6} className="px-6 py-6">
                        <h3 className="font-display text-xl text-text-heading">{enquiry.service_type}</h3>
                        <p className="mt-2 font-body text-sm text-text-muted">
                          We&apos;ve received this request — it&apos;ll move to Pending once our studio begins work.
                        </p>

                        {enquiry.quantity_estimate && (
                          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                            Estimated quantity <span className="normal-case text-text-heading">{enquiry.quantity_estimate}</span>
                          </p>
                        )}

                        {enquiry.portfolio_items && enquiry.portfolio_items.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {enquiry.portfolio_items.map((item) => (
                              <Link
                                key={item.id}
                                href={`/portfolio/${item.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
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
                          <OrderStepper status="placed" theme="light" />
                        </div>

                        <div className="mt-8 border-t border-border pt-6">
                          <Link
                            href={`/order-form/${enquiry.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block border border-accent-gold px-5 py-2.5 font-body text-label uppercase tracking-wider text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary"
                          >
                            Order form
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            }

            const { order, history, latestRevision } = row;
            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => setExpandedId(isOpen ? null : row.id)}
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-black/[0.02] ${isOpen ? 'bg-black/[0.02]' : ''}`}
                >
                  <td className="px-2 py-2.5 text-center">
                    <span className={`inline-block font-mono text-xs text-text-muted transition-transform ${isOpen ? 'rotate-90 text-accent-gold' : ''}`}>▸</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-[10px] text-text-muted">#{order.id.slice(0, 8).toUpperCase()}</p>
                    {latestRevision && latestRevision.status === 'pending_review' && (
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-accent-gold">Review needed</p>
                    )}
                  </td>
                  <td className="hidden max-w-[220px] truncate px-3 py-2.5 font-body text-sm text-text-heading md:table-cell">{order.service_type}</td>
                  <td className="hidden px-3 py-2.5 font-mono text-[10px] text-text-muted lg:table-cell">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-text-heading">
                    {order.payment_amount !== null ? `£${order.payment_amount.toFixed(2)}` : '—'}
                  </td>
                </tr>

                {isOpen && (
                  <tr className="border-b border-border bg-black/[0.015]">
                    <td colSpan={6} className="px-6 py-6">
                      <h3 className="font-display text-xl text-text-heading">{order.service_type}</h3>

                      {latestRevision && latestRevision.status === 'pending_review' && (
                        <Link
                          href={`/account/orders/${order.id}/review`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-4 flex items-center justify-between border border-accent-gold/40 bg-accent-gold/5 px-4 py-3 transition-colors hover:bg-accent-gold/10"
                        >
                          <span className="font-mono text-[11px] uppercase tracking-widest text-accent-gold">
                            Your design (v{latestRevision.version}) is ready to review
                          </span>
                          <span className="font-mono text-[11px] text-accent-gold">→</span>
                        </Link>
                      )}
                      {latestRevision && latestRevision.status === 'changes_requested' && (
                        <div className="mt-4 border border-border bg-white/[0.02] px-4 py-3">
                          <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                            Changes requested on v{latestRevision.version} — the studio is working on a revised proof
                          </span>
                        </div>
                      )}
                      {latestRevision && latestRevision.status === 'approved' && (
                        <div className="mt-4 border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                          <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-600">
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
                              onClick={(e) => e.stopPropagation()}
                              className="border border-border px-3 py-1.5 font-mono text-[10px] text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      )}

                      {order.details && (
                        <p className="mt-4 border-l-2 border-border pl-4 font-body text-sm text-text-muted">{order.details}</p>
                      )}

                      <div onClick={(e) => e.stopPropagation()}>
                        <OrderPaymentSection order={order} />
                      </div>

                      <div className="mt-8">
                        <OrderStepper status={order.status} theme="light" />
                      </div>

                      {order.enquiry_id && (
                        <div className="mt-8 border-t border-border pt-6">
                          <Link
                            href={`/order-form/${order.enquiry_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[10px] uppercase tracking-wider text-text-muted underline transition-colors hover:text-accent-gold"
                          >
                            View order form
                          </Link>
                        </div>
                      )}

                      {history.length > 0 && (
                        <div className="mt-8 border-t border-border pt-6">
                          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">History</p>
                          <ul className="space-y-4 border-l border-border pl-5">
                            {[...history].reverse().map((entry) => (
                              <li key={entry.id} className="relative">
                                <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-accent-gold" aria-hidden="true" />
                                <p className="font-mono text-[10px] uppercase tracking-widest text-accent-gold">{STATUS_LABELS[entry.status]}</p>
                                <p className="font-mono text-[10px] text-text-muted">
                                  {new Date(entry.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {entry.note && <p className="mt-1 font-body text-sm text-text-heading">{entry.note}</p>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
