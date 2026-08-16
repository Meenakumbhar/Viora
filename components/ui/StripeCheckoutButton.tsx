'use client';

import { useState } from 'react';
import type { Order } from '@/types/database';

interface StripeCheckoutButtonProps {
  order: Order;
}

// Stripe Checkout is a hosted, redirect-based flow — unlike PayPalButton there's
// no SDK to load or inline widget to render, just a POST for the session URL
// followed by a full-page redirect to checkout.stripe.com.
export default function StripeCheckoutButton({ order }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/payments/stripe/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error ?? 'Could not start checkout. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = json.data.url;
    } catch {
      setErrorMessage('Could not start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="border border-border px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-heading transition-colors hover:border-accent-gold hover:text-accent-gold disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : `Pay £${order.payment_amount!.toFixed(2)} by card`}
      </button>
      {errorMessage && (
        <p className="mt-2 font-mono text-[10px] text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
