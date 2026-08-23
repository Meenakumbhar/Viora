import type { OrderStatus, PaymentStatus, DesignRevisionStatus } from '@/types/database';

// The order lifecycle collapsed to what a funeral director actually needs to
// track — not the raw 3-value OrderStatus column. Payment and design review
// live in separate fields/tables that never write back to orders.status (see
// getOrderPaymentGate in lib/db.ts), so this stage is DERIVED fresh from all
// three signals every render via deriveDisplayStage() below, rather than
// read off one column. That derivation is also what makes the tracker
// self-correct when an order's status was set inconsistently with reality —
// e.g. an order manually marked "completed" before the customer ever
// approved the proof or paid still correctly shows as awaiting one of those,
// not falsely as done.
//
// Plain/server-safe on purpose — components/ui/OrderStepper.tsx ('use
// client') re-exports this for convenience, but server code (e.g.
// lib/account-orders.ts) imports it from here directly rather than reaching
// into a client component module.
export type DisplayStage =
  | 'enquiry_received'
  | 'order_confirmed'
  | 'in_progress'
  | 'awaiting_review'
  | 'payment'
  | 'completed'
  // Terminal, customer-initiated — deliberately not part of STAGES below,
  // since it's not a step in the normal linear progression (a cancelled
  // enquiry never had an order, payment, or design review to progress
  // through). Only reachable from 'enquiry_received', via isCancelled.
  | 'cancelled';

export const STAGES: DisplayStage[] = [
  'enquiry_received',
  'order_confirmed',
  'in_progress',
  'awaiting_review',
  'payment',
  'completed',
];

export interface DeriveStageInput {
  /** True for a quote/enquiry that hasn't been turned into a real order yet — every other field is ignored (except isCancelled). */
  isPlaced: boolean;
  /** The customer withdrew this enquiry while it was still just a placed quote — takes priority over every other field. */
  isCancelled?: boolean;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Whether a price has actually been set — payment can't be "next" if there's nothing to pay yet. */
  hasPaymentAmount?: boolean;
  /** The order's latest design revision, in ANY status (not just what's shown to the customer elsewhere) — undefined means this order never went through design review at all. */
  latestRevisionStatus?: DesignRevisionStatus;
}

export function deriveDisplayStage({
  isPlaced,
  isCancelled,
  orderStatus,
  paymentStatus,
  hasPaymentAmount,
  latestRevisionStatus,
}: DeriveStageInput): DisplayStage {
  if (isPlaced && isCancelled) return 'cancelled';
  if (isPlaced) return 'enquiry_received';

  const hasRevision = latestRevisionStatus !== undefined;

  // Nothing has actually started — no design work uploaded yet.
  if (orderStatus === 'pending' && !hasRevision) return 'order_confirmed';

  // A proof is sitting in their inbox right now — the one stage that means
  // "you have something to do."
  if (latestRevisionStatus === 'pending_review') return 'awaiting_review';

  // Design work is happening — including the two proofreader-only states a
  // customer never sees named directly, and a customer's own change request
  // currently being worked. Nothing for them to do but wait either way.
  if (hasRevision && latestRevisionStatus !== 'approved') return 'in_progress';

  // Design is approved (or this order never needed review) — payment is the
  // one remaining thing needed from them, once there's actually a price to pay.
  if (hasPaymentAmount && paymentStatus !== 'paid') return 'payment';

  // Every real prerequisite above is satisfied — trust the admin-set status
  // for this final step, but only now, so a status set out of step with
  // reality (e.g. "completed" before approval/payment) can never jump ahead.
  return orderStatus === 'completed' ? 'completed' : 'in_progress';
}

// A best-guess "since when has this order been sitting in its current
// stage" — not a precise per-stage audit trail (payment_status changes
// aren't timestamped anywhere, and awaiting_review/payment/in_progress are
// all derived rather than read off one column, so there's no single source
// of truth to point at). Instead: whichever of "the order's own status last
// changed" or "the latest design revision last changed" happened most
// recently is what actually put the order in its current stage — pick the
// newer of the two, falling back to when the order was first created if
// neither has happened yet (still sitting at enquiry_received/order_confirmed).
export function deriveStageSince({
  orderCreatedAt,
  latestOrderStatusHistoryAt,
  latestRevisionUpdatedAt,
}: {
  orderCreatedAt: string;
  /** created_at of the most recent order_status_history entry, if any. */
  latestOrderStatusHistoryAt?: string | null;
  latestRevisionUpdatedAt?: string | null;
}): string {
  const candidates = [latestOrderStatusHistoryAt, latestRevisionUpdatedAt].filter(
    (v): v is string => Boolean(v)
  );
  if (candidates.length === 0) return orderCreatedAt;
  return candidates.reduce((latest, c) => (new Date(c) > new Date(latest) ? c : latest));
}
