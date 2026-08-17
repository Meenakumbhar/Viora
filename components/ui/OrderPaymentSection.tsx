'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Order } from '@/types/database';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';

const PayPalButton = dynamic(() => import('@/components/ui/PayPalButton'), { ssr: false });
const RazorpayButton = dynamic(() => import('@/components/ui/RazorpayButton'), { ssr: false });

const PAYMENT_STATUS_LABELS = {
  unpaid: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Payment failed',
} as const;

const PAYMENT_STATUS_COLORS = {
  unpaid: 'text-amber-600 border-amber-500/30 bg-amber-500/5',
  paid: 'text-emerald-700 border-emerald-500/30 bg-emerald-500/5',
  failed: 'text-red-600 border-red-500/30 bg-red-500/5',
} as const;

interface OrderPaymentSectionProps {
  order: Order;
}

export default function OrderPaymentSection({ order: initialOrder }: OrderPaymentSectionProps) {
  const [order, setOrder] = useState(initialOrder);
  const [showPayPal, setShowPayPal] = useState(false);

  const hasAmount = order.payment_amount !== null && order.payment_amount > 0;
  const isPaid = order.payment_status === 'paid';
  const canPay = hasAmount && !isPaid;

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Payment status badge */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">Payment</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span
              className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-widest ${PAYMENT_STATUS_COLORS[order.payment_status]}`}
            >
              {PAYMENT_STATUS_LABELS[order.payment_status]}
            </span>
            {hasAmount && (
              <span className="font-display text-lg font-light text-text-heading">
                £{order.payment_amount!.toFixed(2)}
              </span>
            )}
          </div>
          {!hasAmount && !isPaid && (
            <p className="mt-1 font-mono text-[11px] text-text-muted">
              Your quote amount will appear here once confirmed.
            </p>
          )}
        </div>

        {/* Payment method choice — only when amount is set and unpaid */}
        {canPay && !showPayPal && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id={`pay-now-${order.id}`}
              onClick={() => setShowPayPal(true)}
              className="flex items-center gap-2 border border-accent-gold bg-accent-gold px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-bg-primary transition-opacity hover:opacity-90"
            >
              <PaymentProviderIcon provider="paypal" />
              Pay via PayPal
            </button>
            <RazorpayButton order={order} onSuccess={(updated) => setOrder(updated)} />
          </div>
        )}
      </div>

      {/* PayPal button (lazy-loaded after click) */}
      {canPay && showPayPal && (
        <div className="mt-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-text-muted">
            Complete your payment via PayPal
          </p>
          <PayPalButton order={order} onSuccess={(updated) => setOrder(updated)} />
          <button
            type="button"
            onClick={() => setShowPayPal(false)}
            className="mt-3 font-mono text-[11px] text-text-muted hover:text-text-heading"
          >
            ← Cancel
          </button>
        </div>
      )}

      {/* Paid confirmation */}
      {isPaid && order.payment_provider && (order.paypal_order_id || order.razorpay_payment_id) && (
        <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
          <PaymentProviderIcon provider={order.payment_provider} />
          Ref: {(order.paypal_order_id ?? order.razorpay_payment_id!).slice(0, 16).toUpperCase()}
        </p>
      )}
    </div>
  );
}
