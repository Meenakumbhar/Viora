'use client';

import { useState } from 'react';
import DesignReviewCanvas from '@/components/ui/DesignReviewCanvas';
import type { DesignRevision, DesignCommentInput, CommentResolutionField } from '@/types/database';

const STATUS_LABELS: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'Awaiting your review',
  returned_to_designer: 'Sent back to designer',
  pending_review: 'With the customer',
  changes_requested: 'Changes requested by customer',
  approved: 'Approved by customer',
};

const STATUS_COLORS: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  returned_to_designer: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
  pending_review: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  changes_requested: 'border-red-500/30 bg-red-500/15 text-red-400',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
};

interface ProofreaderPanelProps {
  initialRevisions: DesignRevision[];
  /** e.g. '/api/staff/orders/{id}/designs' */
  apiBase: string;
}

export default function ProofreaderPanel({ initialRevisions, apiBase }: ProofreaderPanelProps) {
  const [revisions, setRevisions] = useState(initialRevisions);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...revisions].sort((a, b) => b.version - a.version);
  // Both land on the proofreader's desk: a fresh proof awaiting a first look,
  // or a customer's change request awaiting relay to the designer.
  const current = sorted.find((r) => r.status === 'pending_proofreader_review' || r.status === 'changes_requested');
  const isRelayingChanges = current?.status === 'changes_requested';
  const rest = sorted.filter((r) => r.id !== current?.id);

  async function handleSubmit(action: 'approve' | 'request_changes' | 'return_to_designer', comments: DesignCommentInput[]) {
    if (!current || action === 'request_changes') return; // customer-only action, never reachable from this panel
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/${current.id}/proofread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to submit your review.');
      }
      setRevisions((prev) => prev.map((r) => (r.id === json.data.id ? json.data : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleResolved(commentId: string, field: CommentResolutionField, value: boolean) {
    setRevisions((prev) =>
      prev.map((r) => ({
        ...r,
        comments: r.comments.map((c) => (c.id === commentId ? { ...c, [field]: value } : c)),
      }))
    );

    const res = await fetch(`${apiBase}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value }),
    });

    if (!res.ok) {
      setRevisions((prev) =>
        prev.map((r) => ({
          ...r,
          comments: r.comments.map((c) => (c.id === commentId ? { ...c, [field]: !value } : c)),
        }))
      );
    }
  }

  // A revision the designer just uploaded (or re-uploaded) in another session
  // won't show up here until we re-fetch.
  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(apiBase);
      const json = await res.json();
      if (res.ok && json.success) {
        setRevisions(json.data);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="dash-legacy">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="font-mono text-[10px] uppercase tracking-widest text-white/40 transition-colors hover:text-[#C6A85C] disabled:opacity-40"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {current ? (
        <div className="mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-light">Proof v{current.version}</h2>
            <span className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${STATUS_COLORS[current.status]}`}>
              {STATUS_LABELS[current.status]}
            </span>
          </div>
          {current.notes && <p className="mb-3 font-body text-sm text-white/50">{current.notes}</p>}
          {isRelayingChanges && (
            <p className="mb-3 font-mono text-xs text-white/40">
              The customer requested changes on this proof — review their marks below, add your own if useful, then forward it to the designer.
            </p>
          )}
          {error && <p className="mb-3 font-mono text-xs text-red-400" role="alert">{error}</p>}
          <DesignReviewCanvas
            images={current.image_urls}
            labels={current.image_labels}
            comments={current.comments}
            mode="proofread"
            theme="dark"
            onSubmitReview={handleSubmit}
            submitting={submitting}
            allowApprove={!isRelayingChanges}
            requireMarksForSecondaryAction={!isRelayingChanges}
            compareRevisions={sorted
              .filter((r) => r.id !== current.id)
              .map((r) => ({ version: r.version, label: r.image_labels?.[0] ?? null, image_urls: r.image_urls }))}
          />
        </div>
      ) : (
        <div className="mb-10 border border-white/10 p-8 text-center font-mono text-xs text-white/30">
          Nothing awaiting your review on this order right now. If the designer just uploaded, hit Refresh above.
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/40">Revision history</h3>
          <div className="space-y-10">
            {rest.map((revision) => (
              <div key={revision.id}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-display text-xl font-light">Proof v{revision.version}</h4>
                  <span className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${STATUS_COLORS[revision.status]}`}>
                    {STATUS_LABELS[revision.status]}
                  </span>
                </div>
                {revision.notes && <p className="mb-3 font-body text-sm text-white/50">{revision.notes}</p>}
                <DesignReviewCanvas
                  images={revision.image_urls}
                  labels={revision.image_labels}
                  comments={revision.comments}
                  mode="manage"
                  theme="dark"
                  onToggleResolved={handleToggleResolved}
                  viewerRole="proofreader"
                  compareRevisions={sorted
                    .filter((r) => r.id !== revision.id)
                    .map((r) => ({ version: r.version, label: r.image_labels?.[0] ?? null, image_urls: r.image_urls }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
