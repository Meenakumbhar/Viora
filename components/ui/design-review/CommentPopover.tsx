'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';

interface CommentPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
}

// Anchored to the pin button, not the image — `flip`/`shift` keep it inside
// the viewport near any image edge, and `autoUpdate` with `animationFrame`
// re-anchors it continuously while the pin moves under the zoom/pan
// transform (a plain scroll/resize listener wouldn't catch a CSS transform).
export default function CommentPopover({ open, anchorEl, children }: CommentPopoverProps) {
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'top',
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: (reference, floating, update) => autoUpdate(reference, floating, update, { animationFrame: true }),
  });

  useEffect(() => {
    refs.setReference(anchorEl);
  }, [anchorEl, refs]);

  return (
    <FloatingPortal>
      <AnimatePresence>
        {open && anchorEl && (
          // z-[10000]: DashboardShell renders as a position:fixed, z-index:9999
          // full-viewport layer (components/dashboard/DashboardShell.tsx) — a
          // stacking context that elevates its entire subtree (including a
          // plain, unstyled <img>) above anything portaled to document.body
          // at a lower z-index, however high that z-index looks in isolation.
          // Matches the z-[10000] already used by this codebase's other
          // top-of-everything overlays (e.g. admin delete-confirm modals).
          // eslint-disable-next-line react-hooks/refs -- `refs.setFloating` is floating-ui's documented callback-ref setter, not a `.current` read.
          <div ref={refs.setFloating} style={floatingStyles} className="z-[10000]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 4 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
