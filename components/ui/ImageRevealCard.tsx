'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ImageRevealCardProps {
  src?: string | null;
  alt: string;
  label?: string;
  delay?: number;
  className?: string;
  curtainColor?: string;
  fallbackGradient?: string;
  sizes?: string;
  priority?: boolean;
}

// Replaces a flat colour block with a real photo that both unveils (curtain
// wipe, matching the site's existing reveal language) and settles in from a
// slight zoom — a single coordinated moment rather than a delay-then-swap.
// Falls back to a quiet gradient if the image is missing or fails to load.
export function ImageRevealCard({
  src,
  alt,
  label,
  delay = 0,
  className = '',
  curtainColor = '#C6A85C',
  fallbackGradient = 'linear-gradient(160deg, #F7F4EF 0%, #FAF8F5 50%, #F0EAE0 100%)',
  sizes = '(min-width: 1024px) 40vw, 90vw',
  priority = false,
}: ImageRevealCardProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;

  const containerRef = useRef<HTMLDivElement>(null);
  // whileInView's IntersectionObserver can fire before a page transition has
  // settled into its final scroll position, wrongly conclude the card is out
  // of view, and — since viewport.once is true — never re-check, leaving the
  // curtain stuck fully closed over the image (or the image stuck zoomed in,
  // its reveal never fired) until a real scroll forces a recheck. Checking
  // the real position ourselves before paint sidesteps that; below-the-fold
  // cards are untouched, still using the normal scroll-triggered reveal.
  const [forceVisible, setForceVisible] = useState(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setForceVisible(true);
    }
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden border border-border ${className}`}>
      {showImage ? (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.28 }}
          animate={forceVisible ? { scale: 1 } : undefined}
          whileInView={forceVisible ? undefined : { scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.2, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={src as string}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
            onError={() => setErrored(true)}
          />
        </motion.div>
      ) : (
        <div className="absolute inset-0" style={{ background: fallbackGradient }} />
      )}

      {label && (
        <span className="absolute bottom-3 left-3 z-10 font-mono text-label text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
          {label}
        </span>
      )}

      {/* Curtain wipe */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={forceVisible ? { scaleX: 0 } : undefined}
        whileInView={forceVisible ? undefined : { scaleX: 0 }}
        viewport={{ once: true, margin: '-10%' }}
        transition={{ duration: 0.8, delay, ease: [0.77, 0, 0.18, 1] }}
        style={{ transformOrigin: 'left', background: curtainColor }}
        className="absolute inset-0 z-20"
      />
    </div>
  );
}

export default ImageRevealCard;
