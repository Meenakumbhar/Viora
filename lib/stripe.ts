import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Lazily constructed — most dev environments won't have Stripe keys configured
// yet (it's additive alongside PayPal), so importing this module must not throw.
export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
