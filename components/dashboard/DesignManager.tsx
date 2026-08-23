'use client';

import { useState } from 'react';
import DesignReviewCanvas from '@/components/ui/DesignReviewCanvas';
import { uploadFileDirect } from '@/utils/presigned-upload';
import type { DesignRevision, CommentResolutionField } from '@/types/database';

const STATUS_LABELS: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'Awaiting proofreader',
  returned_to_designer: 'Returned by proofreader',
  pending_review: 'Awaiting customer review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
};

const STATUS_COLORS: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'border-blue-500/30 bg-blue-500/15 text-blue-400',
  returned_to_designer: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
  pending_review: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  changes_requested: 'border-red-500/30 bg-red-500/15 text-red-400',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
};

// Shown when canUploadNext is false, i.e. every status except 'returned_to_designer'.
const WAITING_ON: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'with the proofreader',
  returned_to_designer: '', // unreachable — this is the one uploadable state
  pending_review: "awaiting the customer's review",
  changes_requested: 'awaiting the proofreader — the customer requested changes',
  approved: 'already approved',
};

interface DesignManagerProps {
  initialRevisions: DesignRevision[];
  /** e.g. '/api/admin/orders/{id}/designs' or '/api/staff/orders/{id}/designs' */
  apiBase: string;
  /** Defaults to 'admin' — the shared-password admin login has no per-user role, and has full authority. */
  viewerRole?: 'designer' | 'employee' | 'proofreader' | 'admin';
}

export default function DesignManager({ initialRevisions, apiBase, viewerRole = 'admin' }: DesignManagerProps) {
  const [revisions, setRevisions] = useState(initialRevisions);
  const [files, setFiles] = useState<File[]>([]);
  // Positionally matched to `files` — an optional caption per proof (e.g.
  // "Thank You Card") for orders that bundle several products into one
  // upload, so the customer can tell the proofs apart on the review tabs.
  const [labels, setLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...revisions].sort((a, b) => b.version - a.version);
  const latest = sorted[0];
  // A new upload is only allowed once the proofreader has explicitly routed the
  // latest revision back — never straight off a customer's change request, and
  // never while something is still mid-review. Server-enforced too (createDesignRevision).
  const canUploadNext = !latest || latest.status === 'returned_to_designer';

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const uploaded = await uploadFileDirect(file, { folder: 'designs' });
        imageUrls.push(uploaded.url);
      }

      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          imageLabels: labels.some((l) => l.trim()) ? labels : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to create revision.');
      }

      setRevisions((prev) => [...prev, json.data]);
      setFiles([]);
      setLabels([]);
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setUploading(false);
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
      // Revert on failure
      setRevisions((prev) =>
        prev.map((r) => ({
          ...r,
          comments: r.comments.map((c) => (c.id === commentId ? { ...c, [field]: !value } : c)),
        }))
      );
    }
  }

  // A revision uploaded/returned in another session won't appear until we re-fetch.
  async function handleRefresh() {
    setRefreshing(true);
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
      {/* Upload panel */}
      <div className="mb-10 border border-white/10 bg-white/5 p-6">
        <h2 className="font-display text-2xl font-light">
          {latest ? `Upload proof v${latest.version + 1}` : 'Upload the first proof'}
        </h2>
        {!canUploadNext && latest && (
          <p className="mt-2 font-mono text-xs text-amber-400">
            v{latest.version} is {WAITING_ON[latest.status]} — a new upload isn't possible until the proofreader routes it back to you.
          </p>
        )}
        <div className="mt-4 space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            onChange={(e) => {
              const next = Array.from(e.target.files ?? []);
              setFiles(next);
              setLabels(next.map(() => ''));
            }}
            className="block w-full font-mono text-xs text-white/60 file:mr-4 file:border file:border-white/20 file:bg-transparent file:px-4 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-widest file:text-white/70"
          />

          {files.length > 0 && (
            <div className="space-y-2 border border-white/10 bg-black/20 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Label each proof (optional) — helps the customer tell them apart when reviewing
              </p>
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center gap-3">
                  <span className="w-1/3 truncate font-mono text-[11px] text-white/50" title={file.name}>
                    {file.name}
                  </span>
                  <input
                    type="text"
                    value={labels[i] ?? ''}
                    onChange={(e) =>
                      setLabels((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    placeholder="e.g. Thank You Card"
                    maxLength={200}
                    className="flex-1 border border-white/15 bg-transparent px-3 py-1.5 text-xs text-white outline-none focus:border-[#C6A85C]"
                  />
                </div>
              ))}
            </div>
          )}

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note to the customer (optional) — e.g. what changed since last time"
            rows={2}
            className="w-full border border-white/15 bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-[#C6A85C]"
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="bg-[#C6A85C] px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[#0E1117] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {uploading ? 'Uploading…' : 'Send for review'}
          </button>
        </div>
      </div>

      {/* Revision history */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">Revisions</h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="font-mono text-[10px] uppercase tracking-widest text-white/40 transition-colors hover:text-[#C6A85C] disabled:opacity-40"
        >
          {refreshing ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="font-mono text-xs text-white/30">No proofs uploaded yet.</p>
      ) : (
        <div className="space-y-10">
          {sorted.map((revision) => (
            <div key={revision.id}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-xl font-light">Proof v{revision.version}</h3>
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
                viewerRole={viewerRole}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
