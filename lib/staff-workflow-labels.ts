import type { DesignRevision } from '@/types/database';

// A single source of truth for "what does this design revision's status
// mean to the person looking at it" — used by both the filter pills
// (StaffQueueList) and the per-row status tag (StaffQueueCard), so the same
// underlying state is never worded two different ways in the same UI (that
// mismatch — e.g. a filter pill saying "With proofreader" while the card on
// the exact same row said "Needs your review" — was the source of "the
// filters are jumbled" confusion).
//
// One raw status, `pending_proofreader_review`, is deliberately split into
// two buckets by version number: v1 is a genuinely new proof the proofreader
// has never seen, v2+ came back from the designer after being returned —
// different situations that read very differently to a proofreader even
// though the DB column is identical.
export type WorkflowBucket =
  | 'no_proof'
  | 'new_order_proofread'
  | 'received_from_designer'
  | 'returned_to_designer'
  | 'changes_requested'
  | 'pending_review'
  | 'approved';

export function bucketFor(latest: DesignRevision | undefined): WorkflowBucket {
  if (!latest) return 'no_proof';
  if (latest.status === 'pending_proofreader_review') {
    return latest.version > 1 ? 'received_from_designer' : 'new_order_proofread';
  }
  return latest.status;
}

interface BucketInfo {
  label: string;
  description: string;
  /** Solid, filled — legible on both the dark staff panel and light public surfaces. */
  fill: string;
}

// Every bucket's canonical label/description/color, independent of who's
// looking — a designer and a proofreader viewing the exact same order see
// the exact same tag here. Role only decides which pills are offered as
// FILTERS (see FILTERS_BY_ROLE below), never how a given status is worded.
export const BUCKETS: Record<WorkflowBucket, BucketInfo> = {
  no_proof: {
    label: 'New Order',
    description: 'Order received and awaiting work',
    fill: 'bg-slate-500 text-white',
  },
  new_order_proofread: {
    label: 'New Order',
    description: 'Awaiting proofreading',
    fill: 'bg-[#C6A85C] text-[#0E1117]',
  },
  returned_to_designer: {
    label: 'Sent to Designer',
    description: 'Returned for design work/corrections',
    fill: 'bg-orange-500 text-white',
  },
  received_from_designer: {
    label: 'Received from Designer',
    description: 'Ready for proofreading review',
    fill: 'bg-[#C6A85C] text-[#0E1117]',
  },
  changes_requested: {
    label: 'Changes from Customer',
    description: 'Customer requested changes',
    fill: 'bg-red-500 text-white',
  },
  pending_review: {
    label: 'Sent to Customer',
    description: 'Proof sent for customer approval',
    fill: 'bg-blue-500 text-white',
  },
  approved: {
    label: 'Approved for Print',
    description: 'Customer approved — ready for printing',
    fill: 'bg-emerald-500 text-white',
  },
};

// Designer-facing labels differ slightly from the canonical ones above for
// exactly two buckets — the same underlying state reads differently
// depending on whose desk it's sitting on ("Sent to Designer" from a
// proofreader's point of view is "In Design" from the designer's).
const DESIGNER_OVERRIDES: Partial<Record<WorkflowBucket, BucketInfo>> = {
  returned_to_designer: {
    label: 'In Design',
    description: 'Design work in progress',
    fill: 'bg-orange-500 text-white',
  },
};

export function bucketInfoForRole(bucket: WorkflowBucket, role: string): BucketInfo {
  if (role === 'designer' && DESIGNER_OVERRIDES[bucket]) return DESIGNER_OVERRIDES[bucket]!;
  return BUCKETS[bucket];
}

// Which buckets each role gets as a filter pill, and in what order — a
// designer only ever acts on 3 of the 7 buckets, a proofreader on 6; showing
// every bucket to everyone (the old behaviour) buried the ones a given role
// could actually do something about among ones they couldn't.
export function filterBucketsForRole(role: string): WorkflowBucket[] {
  if (role === 'designer') {
    return ['no_proof', 'returned_to_designer', 'changes_requested'];
  }
  if (role === 'proofreader') {
    return [
      'new_order_proofread',
      'returned_to_designer',
      'received_from_designer',
      'changes_requested',
      'pending_review',
      'approved',
    ];
  }
  // Admin/employee — full oversight, every bucket including the ones
  // designer/proofreader don't get their own pill for.
  return [
    'no_proof',
    'new_order_proofread',
    'returned_to_designer',
    'received_from_designer',
    'changes_requested',
    'pending_review',
    'approved',
  ];
}
