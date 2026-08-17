import type { Instrumentation } from 'next';

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // no-op until a real DSN is set, same as Razorpay/Resend/PayPal

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
