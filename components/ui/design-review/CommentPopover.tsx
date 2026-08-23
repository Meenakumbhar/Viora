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
          // eslint-disable-next-line react-hooks/refs -- `refs.setFloating` is floating-ui's documented callback-ref setter, not a `.current` read.
          <div ref={refs.setFloating} style={floatingStyles} className="z-50">
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
