'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { DesignComment, DesignCommentInput, CommentResolutionField } from '@/types/database';

interface DraftPin extends DesignCommentInput {
  tempId: string;
}

type ReviewAction = 'approve' | 'request_changes' | 'return_to_designer';
type ViewerRole = 'designer' | 'employee' | 'proofreader' | 'admin';

interface DesignReviewCanvasProps {
  images: string[];
  /** Persisted comments to render — pass [] in 'review'/'proofread' mode (a pending revision has none yet). */
  comments?: DesignComment[];
  /** 'review' = customer; 'proofread' = proofreader (adds marks, approves or bounces back to the designer); 'manage' = read-only + resolve toggles. */
  mode: 'review' | 'proofread' | 'manage';
  theme?: 'light' | 'dark';
  onSubmitReview?: (action: ReviewAction, comments: DesignCommentInput[]) => Promise<void> | void;
  /** Designer and proofreader each mark their own status on a comment — one never implies the other. */
  onToggleResolved?: (commentId: string, field: CommentResolutionField, value: boolean) => void;
  /** Who's viewing in 'manage' mode — decides which of the two statuses they're allowed to toggle. */
  viewerRole?: ViewerRole;
  /** 'proofread' mode only — false when relaying a customer's change request, where there's nothing new to send to the customer. Default true. */
  allowApprove?: boolean;
  /** 'proofread' mode only — false lets the secondary action fire with zero new marks (a customer's change request already carries its own). Default true. */
  requireMarksForSecondaryAction?: boolean;
  submitting?: boolean;
}

const THEME = {
  light: {
    panel: 'border border-border bg-bg-primary',
    tab: 'border-border text-text-muted',
    tabActive: 'border-accent-gold text-accent-gold',
    muted: 'text-text-muted',
    heading: 'text-text-heading',
    inputBg: 'bg-bg-primary border border-border text-text-heading',
    button: 'bg-accent-gold text-bg-primary hover:opacity-90',
    buttonOutline: 'border border-border text-text-muted hover:border-accent-gold hover:text-accent-gold',
  },
  dark: {
    panel: 'border border-white/10 bg-[#151C24]',
    tab: 'border-white/15 text-white/40',
    tabActive: 'border-[#C6A85C] text-[#C6A85C]',
    muted: 'text-white/40',
    heading: 'text-white/90',
    inputBg: 'bg-transparent border border-white/20 text-white',
    button: 'bg-[#C6A85C] text-[#0E1117] hover:opacity-90',
    buttonOutline: 'border border-white/20 text-white/50 hover:border-[#C6A85C] hover:text-[#C6A85C]',
  },
} as const;

export default function DesignReviewCanvas({
  images,
  comments = [],
  mode,
  theme = 'light',
  onSubmitReview,
  onToggleResolved,
  viewerRole,
  allowApprove = true,
  requireMarksForSecondaryAction = true,
  submitting = false,
}: DesignReviewCanvasProps) {
  const t = THEME[theme];
  const canToggleDesigner = viewerRole === 'designer' || viewerRole === 'employee' || viewerRole === 'admin';
  const canToggleProofreader = viewerRole === 'proofreader' || viewerRole === 'admin';
  const [activeImage, setActiveImage] = useState(0);
  const [drafts, setDrafts] = useState<DraftPin[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState('');
  const [openPinId, setOpenPinId] = useState<string | null>(null);

  const persistedForImage = comments.filter((c) => c.image_index === activeImage);
  const draftsForImage = drafts.filter((d) => d.image_index === activeImage);

  const canAddPins = mode === 'review' || mode === 'proofread';

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canAddPins) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPendingPin({ x, y });
    setDraftText('');
  }

  function saveDraft() {
    if (!pendingPin || !draftText.trim()) return;
    setDrafts((prev) => [
      ...prev,
      { tempId: `draft-${Date.now()}-${prev.length}`, image_index: activeImage, x: pendingPin.x, y: pendingPin.y, comment: draftText.trim() },
    ]);
    setPendingPin(null);
    setDraftText('');
  }

  function removeDraft(tempId: string) {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  }

  async function handleApprove() {
    await onSubmitReview?.('approve', []);
  }

  async function handleRequestChanges() {
    await onSubmitReview?.(
      mode === 'proofread' ? 'return_to_designer' : 'request_changes',
      drafts.map(({ tempId, ...rest }) => rest)
    );
  }

  return (
    <div className={`${t.panel} p-4 sm:p-6`}>
      {images.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                i === activeImage ? t.tabActive : t.tab
              }`}
            >
              Image {i + 1}
              {comments.filter((c) => c.image_index === i).length > 0 && ` · ${comments.filter((c) => c.image_index === i).length}`}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative w-full select-none overflow-hidden border"
        style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : undefined }}
        onClick={handleImageClick}
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={images[activeImage]}
            alt={`Design proof ${activeImage + 1}`}
            fill
            className="object-contain"
          />
        </div>

        {/* Persisted pins (admin view, or historical) */}
        {persistedForImage.map((c, i) => {
          const fullyResolved = c.designer_resolved && c.proofreader_resolved;
          return (
            <button
              key={c.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPinId(openPinId === c.id ? null : c.id);
              }}
              className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-[10px] font-bold shadow-lg ${
                fullyResolved
                  ? 'border-emerald-400 bg-emerald-500/90 text-white'
                  : 'border-[#C6A85C] bg-[#C6A85C] text-[#0E1117]'
              }`}
              style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
            >
              {i + 1}
            </button>
          );
        })}

        {/* Draft pins (customer, not yet submitted) */}
        {draftsForImage.map((d, i) => (
          <div
            key={d.tempId}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-red-400 bg-red-500 font-mono text-[10px] font-bold text-white shadow-lg"
            style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
          >
            {i + 1}
          </div>
        ))}

        {/* In-progress pin being typed */}
        {pendingPin && (
          <div
            className="absolute z-10 w-56 -translate-x-1/2 rounded border border-red-400 bg-white p-2 shadow-xl"
            style={{ left: `${pendingPin.x * 100}%`, top: `${pendingPin.y * 100}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="What needs to change here?"
              rows={2}
              className="w-full resize-none border border-gray-300 p-1.5 font-body text-xs text-gray-900 outline-none"
            />
            <div className="mt-1.5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingPin(null)} className="font-mono text-[10px] text-gray-400 hover:text-gray-700">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={!draftText.trim()}
                className="bg-red-500 px-2 py-1 font-mono text-[10px] uppercase text-white disabled:opacity-40"
              >
                Pin it
              </button>
            </div>
          </div>
        )}
      </div>

      {canAddPins && (
        <p className={`mt-2 font-mono text-[10px] uppercase tracking-widest ${t.muted}`}>
          Click anywhere on the image to leave a comment
        </p>
      )}

      {/* Comment list */}
      {(persistedForImage.length > 0 || draftsForImage.length > 0) && (
        <ul className="mt-4 space-y-2">
          {persistedForImage.map((c, i) => {
            const fullyResolved = c.designer_resolved && c.proofreader_resolved;
            return (
              <li key={c.id} className={`flex items-start justify-between gap-3 border-b pb-2 ${theme === 'dark' ? 'border-white/5' : 'border-border'}`}>
                <div className="flex gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${fullyResolved ? 'bg-emerald-500 text-white' : 'bg-[#C6A85C] text-[#0E1117]'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <span className={`font-mono text-[9px] uppercase tracking-widest ${c.author_role === 'proofreader' ? 'text-teal-500' : t.muted}`}>
                      {c.author_role === 'proofreader' ? 'Proofreader' : 'Customer'}
                    </span>
                    <p className={`font-body text-sm ${t.heading} ${fullyResolved ? 'line-through opacity-50' : ''}`}>{c.comment}</p>
                  </div>
                </div>
                {mode === 'manage' && onToggleResolved && (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <button
                      type="button"
                      disabled={!canToggleDesigner}
                      onClick={() => onToggleResolved(c.id, 'designer_resolved', !c.designer_resolved)}
                      className={`font-mono text-[9px] uppercase tracking-widest ${canToggleDesigner ? 'cursor-pointer' : 'cursor-default opacity-60'} ${c.designer_resolved ? 'text-emerald-500' : t.muted}`}
                    >
                      Designer: {c.designer_resolved ? 'Fixed' : 'Pending'}
                    </button>
                    <button
                      type="button"
                      disabled={!canToggleProofreader}
                      onClick={() => onToggleResolved(c.id, 'proofreader_resolved', !c.proofreader_resolved)}
                      className={`font-mono text-[9px] uppercase tracking-widest ${canToggleProofreader ? 'cursor-pointer' : 'cursor-default opacity-60'} ${c.proofreader_resolved ? 'text-emerald-500' : t.muted}`}
                    >
                      Proofreader: {c.proofreader_resolved ? 'Confirmed' : 'Pending'}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {draftsForImage.map((d, i) => (
            <li key={d.tempId} className="flex items-start justify-between gap-3 border-b border-red-500/20 pb-2">
              <div className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <p className={`font-body text-sm ${t.heading}`}>{d.comment}</p>
              </div>
              <button type="button" onClick={() => removeDraft(d.tempId)} className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:text-red-500">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAddPins && onSubmitReview && (
        <div className="mt-6 flex flex-wrap gap-3">
          {allowApprove && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className={`px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-opacity disabled:opacity-40 ${t.button}`}
            >
              {mode === 'proofread' ? 'Approve — send to client' : 'Approve design'}
            </button>
          )}
          <button
            type="button"
            onClick={handleRequestChanges}
            disabled={submitting || (requireMarksForSecondaryAction && drafts.length === 0)}
            className={`px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors disabled:opacity-40 ${
              allowApprove ? t.buttonOutline : t.button
            }`}
          >
            {mode === 'proofread' ? (allowApprove ? 'Return to designer' : 'Forward to designer') : 'Request changes'}{' '}
            {drafts.length > 0 && `(${drafts.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
