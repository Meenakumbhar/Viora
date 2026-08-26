'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Order, DesignRevision } from '@/types/database';
import Logo from '@/components/ui/Logo';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';

const PayPalButton = dynamic(() => import('@/components/ui/PayPalButton'), { ssr: false });
const RazorpayButton = dynamic(() => import('@/components/ui/RazorpayButton'), { ssr: false });

interface CheckoutViewProps {
  order: Order;
  latestRevision?: DesignRevision;
  /** From the customer's own account profile — gives Razorpay's checkout a
   *  verified contact number to prefill, alongside name/email, so its risk
   *  scoring has one more genuine identity signal for the transaction. */
  customerPhone?: string | null;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-2.5">
      <span className="font-mono text-sm uppercase tracking-widest text-text-muted">{label}</span>
      <span className="font-body text-base text-text-heading text-right">{value}</span>
    </div>
  );
}

// Stacked, not side-by-side like SummaryRow — this holds whatever length of
// free text the studio put in order.details (a delivery address, a line of
// production notes, or both at once, since there's no separate address
// field on an order), so it needs to wrap rather than assume a short value.
function DetailsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-2.5">
      <span className="block font-mono text-sm uppercase tracking-widest text-text-muted">{label}</span>
      <span className="mt-1 block font-body text-base text-text-heading">{value}</span>
    </div>
  );
}

// A small crosshair, the print trade's own registration mark for aligning
// plates before a run — echoes the same device DashboardShell uses on its
// wordmark, applied here at the corners of the order card to read as a
// production docket rather than a generic summary panel.
function CropMark({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" className={`absolute text-border ${className}`} aria-hidden="true">
      <path d="M6.5 0V4M6.5 9V13M0 6.5H4M9 6.5H13" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

// A tear-off line between the itemized detail and the total — the two
// notches read as where a perforation would separate a ticket stub.
function PerforatedDivider() {
  return (
    <div className="relative border-t border-dashed border-border">
      <span className="absolute -top-[7px] -left-[7px] h-3.5 w-3.5 rounded-full bg-bg-primary" />
      <span className="absolute -top-[7px] -right-[7px] h-3.5 w-3.5 rounded-full bg-bg-primary" />
    </div>
  );
}

// An ink-stamp treatment for payment status — DUE before, PAID after —
// rather than a flat badge; a proof stamp is the closest real-world
// equivalent a print studio has to "this has been checked and cleared."
function StatusStamp({ paid }: { paid: boolean }) {
  return (
    <div
      className={`absolute -right-3 -top-3 flex h-[68px] w-[68px] rotate-[-9deg] select-none items-center justify-center rounded-full border-2 border-dashed font-mono text-sm font-bold uppercase tracking-wider ${
        paid ? 'border-emerald-600/50 text-emerald-700' : 'border-accent-gold/60 text-accent-gold-hover'
      }`}
      aria-hidden="true"
    >
      {paid ? 'Paid' : 'Due'}
    </div>
  );
}

const NEXT_STEPS = [
  { n: '01', label: 'Payment confirmed', detail: 'Production starts the same day.' },
  { n: '02', label: 'In production', detail: 'Your studio team gets to work.' },
  { n: '03', label: 'Delivered', detail: 'Tracked shipping to your door.' },
];

const TRUST_BADGES = [
  {
    label: 'Encrypted',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="10" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Tracked delivery',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 7h11v9H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    label: 'Studio support',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

// Dedicated full-page checkout, distinct from the lighter inline payment
// status shown on the account order list — this is the page that link
// points to once an order is actually payable. Takes over the viewport the
// same way DashboardShell does (fixed, above the site nav/footer) so
// payment gets a distraction-free moment rather than sitting mid-scroll on
// a page with unrelated nav/footer chrome.
export default function CheckoutView({ order: initialOrder, latestRevision, customerPhone }: CheckoutViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [method, setMethod] = useState<'card' | 'paypal'>('card');

  const hasAmount = order.payment_amount !== null && order.payment_amount > 0;
  const isPaid = order.payment_status === 'paid';
  const awaitingDesignApproval = Boolean(latestRevision && latestRevision.status !== 'approved');
  const canPay = hasAmount && !isPaid && !awaitingDesignApproval;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-bg-primary"
      style={{
        backgroundImage: 'url(/images/Payment-checkout.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'left top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <header className="flex items-center justify-between border-b border-border bg-bg-primary/90 px-6 py-4 backdrop-blur-sm md:px-10">
        <Link href="/" className="flex items-center">
          <Logo wordmark="Memories in Prints" containerWidth={170} containerHeight={42} />
        </Link>
        <Link
          href="/account"
          className="font-mono text-sm uppercase tracking-widest text-text-muted transition-colors hover:text-text-heading"
        >
          ← Back to your account
        </Link>
      </header>

      <div className="container-wide py-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
          {/* ── Left — order docket ──────────────────────────────────────── */}
          <div>
            <span className="font-mono text-sm uppercase tracking-widest text-accent-gold">{order.service_type}</span>
            <h1
              className="mt-2 font-display text-display-lg font-light text-text-heading"
              style={{ letterSpacing: '-0.02em' }}
            >
              Order summary
            </h1>
            <p className="mt-1 font-mono text-sm text-text-muted">Docket No. {order.id.slice(0, 8).toUpperCase()}</p>

            <div className="relative mt-6 border border-border bg-bg-primary">
              <CropMark className="-top-[7px] -left-[7px]" />
              <CropMark className="-top-[7px] -right-[7px]" />
              <CropMark className="-bottom-[7px] -left-[7px]" />
              <CropMark className="-bottom-[7px] -right-[7px]" />

              <div className="divide-y divide-border">
                <SummaryRow label="Service" value={order.service_type} />
                {order.event_date && (
                  <SummaryRow
                    label="Event date"
                    value={new Date(order.event_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  />
                )}
                {order.quantity_estimate && <SummaryRow label="Quantity" value={order.quantity_estimate} />}
                {order.details && <DetailsRow label="Delivery & details" value={order.details} />}
                <SummaryRow
                  label="Placed"
                  value={new Date(order.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
              </div>

              <PerforatedDivider />

              <div className="flex items-center justify-between px-5 py-3">
                <span className="font-mono text-sm uppercase tracking-widest text-text-muted">Total due</span>
                <span className="font-display text-2xl font-light text-text-heading">
                  {hasAmount ? `£${order.payment_amount!.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>

            {order.portfolio_items && order.portfolio_items.length > 0 && (
              <div className="mt-6">
                <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Referenced designs</p>
                <div className="mt-3 flex flex-wrap gap-2">
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
              </div>
            )}

            <div className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
              {NEXT_STEPS.map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="font-mono text-sm text-accent-gold">{step.n}</span>
                  <div>
                    <p className="font-body text-base font-medium text-text-heading">{step.label}</p>
                    <p className="mt-0.5 font-body text-sm text-text-muted">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right — payment panel ────────────────────────────────────── */}
          <div className="lg:sticky lg:top-10 lg:self-start">
            <div className="relative overflow-visible border-t-4 border-accent-gold bg-[#0F4C5C] p-6 shadow-[0_24px_60px_rgba(28,37,48,0.28)] md:p-8">
              <StatusStamp paid={isPaid} />

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                <p className="font-mono text-sm uppercase tracking-widest text-accent-gold">Payment</p>
              </div>

              <p className="mt-5 font-mono text-sm uppercase tracking-widest text-bg-primary/55">Amount due</p>
              <p className="mt-1 font-display text-display-lg font-light text-bg-primary">
                {hasAmount ? `£${order.payment_amount!.toFixed(2)}` : '—'}
              </p>
              <p className="mt-1 font-mono text-sm text-bg-primary/45">
                Billed to {order.customer_name} · {order.customer_email}
              </p>

              {isPaid ? (
                <div className="mt-6 flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="font-mono text-sm uppercase tracking-widest text-emerald-300">
                    Paid{order.payment_provider ? ` via ${order.payment_provider}` : ''}
                  </p>
                </div>
              ) : !hasAmount ? (
                <p className="mt-6 font-body text-base text-bg-primary/60">
                  Your quote amount will appear here once confirmed.
                </p>
              ) : awaitingDesignApproval ? (
                <p className="mt-6 font-body text-base text-bg-primary/60">
                  Payment opens once you&apos;ve approved the design proof.
                </p>
              ) : (
                canPay && (
                  <>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMethod('card')}
                        aria-pressed={method === 'card'}
                        className={`flex items-center justify-center gap-2 border px-4 py-2.5 font-mono text-sm uppercase tracking-widest transition-colors ${
                          method === 'card'
                            ? 'border-accent-gold bg-accent-gold text-text-heading'
                            : 'border-bg-primary/20 bg-bg-primary/10 text-bg-primary/70 hover:border-accent-gold hover:text-accent-gold'
                        }`}
                      >
                        <PaymentProviderIcon provider="razorpay" />
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod('paypal')}
                        aria-pressed={method === 'paypal'}
                        className={`flex items-center justify-center gap-2 border px-4 py-2.5 font-mono text-sm uppercase tracking-widest transition-colors ${
                          method === 'paypal'
                            ? 'border-accent-gold bg-accent-gold text-text-heading'
                            : 'border-bg-primary/20 bg-bg-primary/10 text-bg-primary/70 hover:border-accent-gold hover:text-accent-gold'
                        }`}
                      >
                        <PaymentProviderIcon provider="paypal" />
                        PayPal
                      </button>
                    </div>

                    <div className="mt-6">
                      {method === 'card' ? (
                        <RazorpayButton order={order} customerPhone={customerPhone} onSuccess={setOrder} />
                      ) : (
                        <PayPalButton order={order} onSuccess={setOrder} />
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3 border-t border-bg-primary/15 pt-5">
                      {TRUST_BADGES.map((badge) => (
                        <div key={badge.label} className="flex flex-col items-center gap-1.5 text-center text-accent-gold">
                          {badge.icon}
                          <span className="font-mono text-[11px] uppercase leading-tight tracking-wide text-bg-primary/55">
                            {badge.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
