'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DesignReviewCanvas from './DesignReviewCanvas';
import type { DesignCommentInput } from '@/types/database';

interface DesignReviewSubmitProps {
  orderId: string;
  revisionId: string;
  images: string[];
  version: number;
}

export default function DesignReviewSubmit({ orderId, revisionId, images, version }: DesignReviewSubmitProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<'approved' | 'changes_requested' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(action: 'approve' | 'request_changes' | 'return_to_designer', comments: DesignCommentInput[]) {
    if (action === 'return_to_designer') return; // proofreader-only action, never reachable in customer mode
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/account/orders/${orderId}/designs/${revisionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to submit your review.');
      }

      setDone(action === 'approve' ? 'approved' : 'changes_requested');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-label uppercase tracking-wider text-accent-gold">
          {done === 'approved' ? 'Design approved' : 'Changes requested'}
        </p>
        <p className="mt-3 font-body text-body-base text-text-muted">
          {done === 'approved'
            ? "Thanks for confirming — we'll move this into production."
            : "Thanks — we've passed your notes to the studio and will send a revised proof soon."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-text-muted">Proof v{version}</p>
      {error && (
        <p className="mb-4 font-mono text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      <DesignReviewCanvas
        images={images}
        comments={[]}
        mode="review"
        theme="light"
        onSubmitReview={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
}
