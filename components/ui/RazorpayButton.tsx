'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@/types/database';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface RazorpayButtonProps {
  order: Order;
  onSuccess: (updatedOrder: Order) => void;
}

// Unlike PayPal's inline-rendered button, Razorpay Checkout.js opens a modal
// on demand — this is a plain button that loads the script once, then drives
// create-order → open modal → verify on its own click handler.
export default function RazorpayButton({ order, onSuccess }: RazorpayButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  useEffect(() => {
    if (!keyId) return;

    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById('razorpay-sdk') as HTMLScriptElement | null;
    if (existing) {
      const handleLoad = () => setScriptLoaded(true);
      const handleError = () => {
        setStatus('error');
        setErrorMessage('Failed to load Razorpay. Please refresh and try again.');
      };
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setStatus('error');
      setErrorMessage('Failed to load Razorpay. Please refresh and try again.');
    };
    document.body.appendChild(script);
  }, [keyId]);

  async function handleClick() {
    if (!scriptLoaded || !window.Razorpay || !keyId) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const createRes = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok || !createJson.success) {
        setStatus('error');
        setErrorMessage(createJson.error ?? 'Could not initiate payment. Please try again.');
        return;
      }

      const { razorpayOrderId, amount, currency } = createJson.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'Memories in Prints',
        description: order.service_type,
        theme: { color: '#C6A85C' },

        handler: async (response: RazorpayCheckoutResponse) => {
          setStatus('loading');

          const verifyRes = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyJson = await verifyRes.json();

          if (!verifyRes.ok || !verifyJson.success) {
            setStatus('error');
            setErrorMessage(verifyJson.error ?? 'Payment failed. Please contact us.');
            return;
          }

          setStatus('success');
          onSuccess(verifyJson.data);
        },

        modal: {
          // The customer simply closed the checkout without paying — not a
          // real failure, so stay quiet rather than showing a scary error.
          ondismiss: () => setStatus('idle'),
        },
      });

      razorpay.open();
    } catch {
      setStatus('error');
      setErrorMessage('Could not initiate payment. Please try again.');
    }
  }

  if (!keyId) {
    return (
      <p className="font-mono text-[11px] text-red-500">
        Card payments are not configured. Please contact us to arrange payment.
      </p>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-600">
          Payment successful — thank you!
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!scriptLoaded || status === 'loading'}
        className="flex items-center gap-2 border border-border px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-text-heading transition-colors hover:border-accent-gold hover:text-accent-gold disabled:opacity-60"
      >
        <PaymentProviderIcon provider="razorpay" />
        {status === 'loading' ? 'Processing…' : `Pay £${order.payment_amount!.toFixed(2)} by card`}
      </button>
      {status === 'error' && errorMessage && (
        <p className="mt-2 font-mono text-[11px] text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
