import type { DisplayStage } from '@/lib/order-stage';
import type { OrderStatus } from '@/types/database';

// A raw admin-set status (plus the synthetic "placed" for an un-converted
// enquiry) — distinct from DisplayStage, which is the customer-facing
// derived stage. Used for genuinely coarse views (the spend-sheet's status
// counts, the order audit-log entries) that want "what did an admin
// actually set" rather than the trustworthy derived lifecycle position.
export type RawOrderDisplayStatus = 'placed' | OrderStatus;

export const RAW_STATUS_LABELS: Record<RawOrderDisplayStatus, string> = {
  placed: 'Placed',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const RAW_STATUS_COLORS: Record<RawOrderDisplayStatus, string> = {
  placed: '#6B6F8C',
  pending: '#A87A2A',
  in_progress: '#2D5FA8',
  completed: '#2F6B2C',
};

export const STATUS_LABELS: Record<DisplayStage, string> = {
  enquiry_received: 'Enquiry Received',
  order_confirmed: 'Order Confirmed',
  in_progress: 'In Progress',
  awaiting_review: 'Awaiting Your Review',
  payment: 'Payment',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<DisplayStage, string> = {
  enquiry_received: '#6B6F8C',
  order_confirmed: '#A87A2A',
  in_progress: '#2D5FA8',
  // Both action-needed stages share a warmer, more attention-getting tone —
  // deliberately distinct from the passive "something's happening" blue.
  awaiting_review: '#C6A85C',
  payment: '#C6A85C',
  completed: '#2F6B2C',
};
