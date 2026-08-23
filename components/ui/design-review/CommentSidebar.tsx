'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { DesignComment, CommentResolutionField } from '@/types/database';
import { timeAgo, formatDateTime } from '@/lib/format';
import { THEME } from './theme';

interface DraftItem {
  tempId: string;
  comment: string;
}

interface CommentSidebarProps {
  persisted: DesignComment[];
  drafts: DraftItem[];
  mode: 'review' | 'proofread' | 'manage';
  theme: keyof typeof THEME;
  selectedCommentId: string | null;
  onSelect: (id: string) => void;
  onRemoveDraft: (tempId: string) => void;
  onToggleResolved?: (commentId: string, field: CommentResolutionField, value: boolean) => void;
  canToggleDesigner: boolean;
  canToggleProofreader: boolean;
}

export default function CommentSidebar({
  persisted,
  drafts,
  mode,
  theme,
  selectedCommentId,
  onSelect,
  onRemoveDraft,
  onToggleResolved,
  canToggleDesigner,
  canToggleProofreader,
}: CommentSidebarProps) {
  const t = THEME[theme];
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    if (!selectedCommentId) return;
    rowRefs.current.get(selectedCommentId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedCommentId]);

  if (persisted.length === 0 && drafts.length === 0) {
    return (
      <div className={`flex items-center justify-center border p-6 font-mono text-base uppercase tracking-widest ${t.sidebarBorder} ${t.muted}`}>
        No comments on this image yet
      </div>
    );
  }

  return (
    <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {persisted.map((c, i) => {
        const fullyResolved = c.designer_resolved && c.proofreader_resolved;
        const isSelected = selectedCommentId === c.id;
        return (
          <motion.li
            layout
            key={c.id}
            ref={(el) => {
              if (el) rowRefs.current.set(c.id, el);
              else rowRefs.current.delete(c.id);
            }}
            onClick={() => onSelect(c.id)}
            className={`flex cursor-pointer items-start justify-between gap-3 border-b pb-2 transition-colors ${t.rowBorder} ${
              isSelected ? 'bg-[#C6A85C]/10' : ''
            }`}
          >
            <div className="flex gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-base font-bold ${
                  fullyResolved ? 'bg-emerald-500 text-white' : 'bg-[#C6A85C] text-[#0E1117]'
                }`}
              >
                {i + 1}
              </span>
              <div>
                <span className={`font-mono text-base uppercase tracking-widest ${c.author_role === 'proofreader' ? 'text-teal-500' : t.muted}`}>
                  {c.author_role === 'proofreader' ? 'Proofreader' : 'Customer'}
                </span>
                <span className={`ml-2 font-mono text-base normal-case ${t.muted}`} title={formatDateTime(c.created_at)}>
                  {timeAgo(c.created_at)}
                </span>
                <p className={`font-body text-base ${t.heading} ${fullyResolved ? 'line-through opacity-50' : ''}`}>{c.comment}</p>
              </div>
            </div>
            {mode === 'manage' && onToggleResolved && (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button
                  type="button"
                  disabled={!canToggleDesigner}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleResolved(c.id, 'designer_resolved', !c.designer_resolved);
                  }}
                  className={`font-mono text-base uppercase tracking-widest ${canToggleDesigner ? 'cursor-pointer' : 'cursor-default opacity-60'} ${
                    c.designer_resolved ? 'text-emerald-500' : t.muted
                  }`}
                >
                  Designer: {c.designer_resolved ? 'Fixed' : 'Pending'}
                </button>
                <button
                  type="button"
                  disabled={!canToggleProofreader}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleResolved(c.id, 'proofreader_resolved', !c.proofreader_resolved);
                  }}
                  className={`font-mono text-base uppercase tracking-widest ${canToggleProofreader ? 'cursor-pointer' : 'cursor-default opacity-60'} ${
                    c.proofreader_resolved ? 'text-emerald-500' : t.muted
                  }`}
                >
                  Proofreader: {c.proofreader_resolved ? 'Confirmed' : 'Pending'}
                </button>
              </div>
            )}
          </motion.li>
        );
      })}
      {drafts.map((d, i) => (
        <li key={d.tempId} className="flex items-start justify-between gap-3 border-b border-red-500/20 pb-2">
          <div className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 font-mono text-base font-bold text-white">
              {i + 1}
            </span>
            <p className={`font-body text-base ${t.heading}`}>{d.comment}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemoveDraft(d.tempId)}
            className="shrink-0 font-mono text-base uppercase tracking-widest text-red-400 hover:text-red-500"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
