'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { DesignComment, DesignCommentInput, CommentResolutionField } from '@/types/database';
import ZoomPanStage from './design-review/ZoomPanStage';
import CommentPopover from './design-review/CommentPopover';
import CommentSidebar from './design-review/CommentSidebar';
import RevisionCompareToggle, { type CompareRevisionOption } from './design-review/RevisionCompareToggle';
import { THEME } from './design-review/theme';
import { timeAgo, formatDateTime } from '@/lib/format';

interface DraftPin extends DesignCommentInput {
  tempId: string;
}

type ReviewAction = 'approve' | 'request_changes' | 'return_to_designer';
type ViewerRole = 'designer' | 'employee' | 'proofreader' | 'admin';

interface DesignReviewCanvasProps {
  images: string[];
  /** Positionally matched to images — e.g. "Thank You Card". Falls back to "Image N" per-slot when missing/blank. */
  labels?: (string | null)[] | null;
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
  /** Other revisions of this same order, for the optional side-by-side "compare with" view. Omit/empty to hide the control entirely. */
  compareRevisions?: CompareRevisionOption[];
}

const EASE = [0.22, 1, 0.36, 1] as const;
const PENDING_ANCHOR_ID = '__pending__';

function Pin({
  anchorId,
  index,
  x,
  y,
  color,
  isActive,
  interactive,
  onClick,
}: {
  anchorId: string;
  index: number;
  x: number;
  y: number;
  color: string;
  isActive: boolean;
  interactive: boolean;
  onClick?: () => void;
}) {
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
      {isActive && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#C6A85C]/60" />}
      <motion.button
        type="button"
        data-pin-anchor={anchorId}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: EASE }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 font-mono text-base font-bold shadow-lg ${color} ${
          interactive ? 'cursor-pointer' : 'cursor-default'
        }`}
      >
        {index}
      </motion.button>
    </span>
  );
}

export default function DesignReviewCanvas({
  images,
  labels,
  comments = [],
  mode,
  theme = 'light',
  onSubmitReview,
  onToggleResolved,
  viewerRole,
  allowApprove = true,
  requireMarksForSecondaryAction = true,
  submitting = false,
  compareRevisions = [],
}: DesignReviewCanvasProps) {
  const t = THEME[theme];
  const canToggleDesigner = viewerRole === 'designer' || viewerRole === 'employee' || viewerRole === 'admin';
  const canToggleProofreader = viewerRole === 'proofreader' || viewerRole === 'admin';
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [drafts, setDrafts] = useState<DraftPin[]>([]);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState('');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [compareTarget, setCompareTarget] = useState<CompareRevisionOption | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const persistedForImage = comments.filter((c) => c.image_index === activeImage);
  const draftsForImage = drafts.filter((d) => d.image_index === activeImage);
  const selectedComment = persistedForImage.find((c) => c.id === selectedCommentId) ?? null;

  // Each pin carries its own `data-pin-anchor` id; the popover looks up its
  // anchor imperatively rather than through a component ref, since pins are
  // `motion.button`s and framer-motion's ref forwarding here doesn't reliably
  // hand back the DOM node for anchoring purposes.
  const activeAnchorId = pendingPin ? PENDING_ANCHOR_ID : selectedCommentId;
  useEffect(() => {
    // Syncing from an external system (the DOM node a pin rendered to), not
    // deriving from React state — the legitimate exception this rule allows for.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!activeAnchorId) {
      setAnchorEl(null);
      return;
    }
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-pin-anchor="${CSS.escape(activeAnchorId)}"]`) ?? null;
    setAnchorEl(el);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeAnchorId, activeImage, compareTarget]);

  const canAddPins = mode === 'review' || mode === 'proofread';

  const handleTap = useCallback(
    (x: number, y: number) => {
      if (!canAddPins) return;
      setSelectedCommentId(null);
      setPendingPin({ x, y });
      setDraftText('');
    },
    [canAddPins]
  );

  function selectComment(id: string) {
    setPendingPin(null);
    setSelectedCommentId((prev) => (prev === id ? null : id));
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

  const labelFor = (i: number) => labels?.[i]?.trim() || `Image ${i + 1}`;

  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-border';

  function renderPersistedPins() {
    return persistedForImage.map((c, i) => {
      const fullyResolved = c.designer_resolved && c.proofreader_resolved;
      return (
        <Pin
          key={c.id}
          anchorId={c.id}
          index={i + 1}
          x={c.x}
          y={c.y}
          isActive={selectedCommentId === c.id}
          interactive
          color={fullyResolved ? 'border-emerald-400 bg-emerald-500/90 text-white' : 'border-[#C6A85C] bg-[#C6A85C] text-[#0E1117]'}
          onClick={() => selectComment(c.id)}
        />
      );
    });
  }

  function renderDraftPins() {
    return draftsForImage.map((d, i) => (
      <Pin key={d.tempId} anchorId={`draft-${d.tempId}`} index={i + 1} x={d.x} y={d.y} isActive={false} interactive={false} color="border-red-400 bg-red-500 text-white" />
    ));
  }

  function renderPendingPin() {
    if (!pendingPin) return null;
    return (
      <Pin
        anchorId={PENDING_ANCHOR_ID}
        index={draftsForImage.length + 1}
        x={pendingPin.x}
        y={pendingPin.y}
        isActive
        interactive={false}
        color="border-red-400 bg-red-500 text-white"
      />
    );
  }

  return (
    <div ref={rootRef} className={`${t.panel} p-4 sm:p-6`}>
      {images.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveImage(i);
                setPendingPin(null);
                setSelectedCommentId(null);
              }}
              className={`border px-3 py-1.5 font-mono text-base uppercase tracking-widest transition-colors ${
                i === activeImage ? t.tabActive : t.tab
              }`}
            >
              {labelFor(i)}
              {comments.filter((c) => c.image_index === i).length > 0 && ` · ${comments.filter((c) => c.image_index === i).length}`}
            </button>
          ))}
        </div>
      ) : (
        labels?.[0]?.trim() && (
          <p className={`mb-3 font-mono text-base uppercase tracking-widest ${t.muted}`}>{labels[0]!.trim()}</p>
        )
      )}

      <RevisionCompareToggle options={compareRevisions} active={compareTarget} onChange={setCompareTarget} theme={theme} />

      <div className={`grid gap-4 ${compareTarget ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
        {compareTarget ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={`mb-2 font-mono text-base uppercase tracking-widest ${t.muted}`}>Current</p>
              <ZoomPanStage onTap={canAddPins ? handleTap : undefined} borderClassName={borderClass}>
                <Image
                  src={images[activeImage]}
                  alt={`Design proof — ${labelFor(activeImage)}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
                {renderPersistedPins()}
                {renderDraftPins()}
                {renderPendingPin()}
              </ZoomPanStage>
            </div>
            <div>
              <p className={`mb-2 font-mono text-base uppercase tracking-widest ${t.muted}`}>
                {compareTarget.label?.trim() || `v${compareTarget.version}`}
              </p>
              <ZoomPanStage borderClassName={borderClass}>
                <Image
                  src={compareTarget.image_urls[activeImage] ?? compareTarget.image_urls[0]}
                  alt={`Design proof — ${compareTarget.label?.trim() || `v${compareTarget.version}`}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </ZoomPanStage>
            </div>
          </div>
        ) : (
          <ZoomPanStage onTap={canAddPins ? handleTap : undefined} borderClassName={borderClass}>
            <Image
              src={images[activeImage]}
              alt={`Design proof — ${labelFor(activeImage)}`}
              fill
              unoptimized
              className="object-contain"
            />
            {renderPersistedPins()}
            {renderDraftPins()}
            {renderPendingPin()}
          </ZoomPanStage>
        )}

        {!compareTarget && (
          <CommentSidebar
            persisted={persistedForImage}
            drafts={draftsForImage}
            mode={mode}
            theme={theme}
            selectedCommentId={selectedCommentId}
            onSelect={selectComment}
            onRemoveDraft={removeDraft}
            onToggleResolved={onToggleResolved}
            canToggleDesigner={canToggleDesigner}
            canToggleProofreader={canToggleProofreader}
          />
        )}
      </div>

      <CommentPopover open={Boolean(pendingPin)} anchorEl={pendingPin ? anchorEl : null}>
        <div className="w-56 rounded border border-gray-300 bg-white p-2 shadow-xl">
          <textarea
            autoFocus
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="What needs to change here?"
            rows={2}
            className="w-full resize-none border border-gray-300 p-1.5 font-body text-base text-gray-900 outline-none"
          />
          <div className="mt-1.5 flex justify-end gap-2">
            <button type="button" onClick={() => setPendingPin(null)} className="font-mono text-base text-gray-400 hover:text-gray-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={!draftText.trim()}
              className="bg-red-500 px-2 py-1 font-mono text-base uppercase text-white disabled:opacity-40"
            >
              Pin it
            </button>
          </div>
        </div>
      </CommentPopover>

      <CommentPopover open={Boolean(selectedComment)} anchorEl={selectedComment ? anchorEl : null}>
        {selectedComment && (
          <div className={`w-60 rounded border p-3 shadow-xl ${t.popoverBg}`}>
            <span className={`font-mono text-base uppercase tracking-widest ${selectedComment.author_role === 'proofreader' ? 'text-teal-500' : t.muted}`}>
              {selectedComment.author_role === 'proofreader' ? 'Proofreader' : 'Customer'}
            </span>
            <span className={`ml-2 font-mono text-base normal-case ${t.muted}`} title={formatDateTime(selectedComment.created_at)}>
              {timeAgo(selectedComment.created_at)}
            </span>
            <p className="mt-1 font-body text-base">{selectedComment.comment}</p>
            {mode === 'manage' && (
              <p className={`mt-2 font-mono text-base uppercase tracking-widest ${t.muted}`}>
                Designer: {selectedComment.designer_resolved ? 'Fixed' : 'Pending'} · Proofreader:{' '}
                {selectedComment.proofreader_resolved ? 'Confirmed' : 'Pending'}
              </p>
            )}
          </div>
        )}
      </CommentPopover>

      {canAddPins && !compareTarget && (
        <p className={`mt-2 font-mono text-base uppercase tracking-widest ${t.muted}`}>
          Tap the image to leave a comment · scroll or pinch to zoom
        </p>
      )}

      {canAddPins && onSubmitReview && (
        <div className="mt-6 flex flex-wrap gap-3">
          {allowApprove && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className="bg-emerald-600 px-5 py-2.5 font-mono text-base font-semibold uppercase tracking-widest text-white transition-colors hover:bg-emerald-500 disabled:opacity-40"
            >
              {mode === 'proofread' ? 'Approve — send to client' : 'Approve design'}
            </button>
          )}
          <button
            type="button"
            onClick={handleRequestChanges}
            disabled={submitting || (requireMarksForSecondaryAction && drafts.length === 0)}
            className="bg-orange-600 px-5 py-2.5 font-mono text-base font-semibold uppercase tracking-widest text-white transition-colors hover:bg-orange-500 disabled:opacity-40"
          >
            {mode === 'proofread' ? (allowApprove ? 'Return to designer' : 'Forward to designer') : 'Request changes'}{' '}
            {drafts.length > 0 && `(${drafts.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
