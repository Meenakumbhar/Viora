'use client';

import { Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams } from 'next/navigation';

function PageTransitionInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Query-only navigations (e.g. /portfolio?category=funeral) don't change
  // pathname, but the category filter swaps the whole hero — so the key/
  // scroll-reset has to track the full URL, not just the path.
  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [routeKey]);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// useSearchParams() needs a Suspense boundary above it, or Next bails out of
// static rendering for every route this wraps (which is every route — this
// sits in the root layout). The fallback renders the page content directly,
// un-animated, so prerendering (and the initial paint) never blocks on it —
// PageTransitionInner then swaps in once search params are available.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <PageTransitionInner>{children}</PageTransitionInner>
    </Suspense>
  );
}
