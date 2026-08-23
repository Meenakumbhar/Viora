'use client';

import { useEffect, useRef, useState } from 'react';
import type { Order } from '@/types/database';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (selector: string) => Promise<void>;
        close?: () => void;
      };
    };
  }
}

interface PayPalButtonProps {
  order: Order;
  onSuccess: (updatedOrder: Order) => void;
}

export default function PayPalButton({ order, onSuccess }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const rendered = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  // Load the PayPal SDK script once, shared across every PayPalButton instance
  // on the page (one per payable order). Multiple instances can mount before
  // the first one's script finishes downloading, so "the tag exists" is not
  // the same as "it's loaded" — wait for the real load event either way.
  useEffect(() => {
    if (!clientId) return;

    if (window.paypal) {
      setScriptLoaded(true);
      return;
    }

    const existing = document.getElementById('paypal-sdk') as HTMLScriptElement | null;
    if (existing) {
      const handleLoad = () => setScriptLoaded(true);
      const handleError = () => {
        setStatus('error');
        setErrorMessage('Failed to load PayPal. Please refresh and try again.');
      };
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=GBP&intent=capture`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setStatus('error');
      setErrorMessage('Failed to load PayPal. Please refresh and try again.');
    };
    document.body.appendChild(script);
  }, [clientId]);

  // Render the PayPal button once the SDK is ready
  useEffect(() => {
    if (!scriptLoaded) return;

    if (!window.paypal) {
      setStatus('error');
      setErrorMessage('PayPal could not be loaded — this is usually an ad blocker or network issue. Please refresh and try again.');
      return;
    }

    if (rendered.current) return;
    rendered.current = true;

    window.paypal
      .Buttons({
        style: {
          layout: 'horizontal',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          tagline: false,
          height: 40,
        },

        // Step 1: Create PayPal order server-side
        createOrder: async () => {
          setStatus('loading');
          setErrorMessage('');

          const res = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id }),
          });

          const json = await res.json();

          if (!res.ok || !json.success) {
            setStatus('error');
            setErrorMessage(json.error ?? 'Could not initiate payment. Please try again.');
            throw new Error(json.error);
          }

          return json.data.paypalOrderId;
        },

        // Step 2: Capture after customer approves
        onApprove: async (data: { orderID: string }) => {
          setStatus('loading');

          const res = await fetch('/api/payments/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID, orderId: order.id }),
          });

          const json = await res.json();

          if (!res.ok || !json.success) {
            setStatus('error');
            setErrorMessage(json.error ?? 'Payment failed. Please contact us.');
            return;
          }

          setStatus('success');
          onSuccess(json.data);
        },

        // PayPal's SDK often fires onError (not onCancel) when the customer simply
        // closes the popup rather than clicking its own "Cancel" link — there's no
        // reliable way to tell that apart from a real failure here, and a scary red
        // error for a routine cancel is worse than staying quiet. Log it for us,
        // but don't alarm the customer; genuine failures already surface their own
        // specific message from the createOrder/onApprove handlers above.
        onError: (err: unknown) => {
          console.error('[PayPal] button error:', err);
          setStatus('idle');
          setErrorMessage('');
        },

        onCancel: () => {
          setStatus('idle');
        },
      })
      .render(`#paypal-btn-${order.id}`);
  }, [scriptLoaded, order.id, order, onSuccess]);

  if (!clientId) {
    return (
      <p className="font-mono text-base text-red-500">
        PayPal is not configured. Please contact us to arrange payment.
      </p>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        <p className="font-mono text-base uppercase tracking-widest text-emerald-600">
          Payment successful — thank you!
        </p>
      </div>
    );
  }

  return (
    <div>
      {status === 'loading' && (
        <p className="mb-2 font-mono text-base uppercase tracking-widest text-text-muted">
          Processing…
        </p>
      )}
      {status === 'error' && errorMessage && (
        <p className="mb-2 font-mono text-base text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
      <div
        id={`paypal-btn-${order.id}`}
        ref={containerRef}
        className="max-w-[280px]"
      />
    </div>
  );
}
