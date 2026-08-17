import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No-op until a real DSN is set — same graceful-degradation pattern as
// Razorpay/Resend/PayPal elsewhere in this app.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Session replay is off by default — enable deliberately once privacy
    // implications (masking card/personal fields) have been reviewed.
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
