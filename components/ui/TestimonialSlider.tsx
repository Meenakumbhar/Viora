'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { testimonials } from '@/lib/data';

const INTERVAL_MS = 6000;

export default function TestimonialSlider({ dark = false }: { dark?: boolean }) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = testimonials.length;

  const goTo = useCallback(
    (index: number) => {
      if (transitioning) return;
      setTransitioning(true);

      // Let the fade-out happen, then swap
      timeoutRef.current = setTimeout(() => {
        setCurrent(index);
        setTransitioning(false);
      }, 300);
    },
    [transitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % total);
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total);
  }, [current, total, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      goTo((current + 1) % total);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [current, isHovered, total, goTo]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const testimonial = testimonials[current];

  const quoteColor = dark ? 'text-white' : 'text-text-heading';
  const metaColor  = dark ? 'text-white/80' : 'text-text-muted';

  return (
    <div
      className="relative mx-auto max-w-5xl px-4 text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quote region */}
      <div aria-live="polite" aria-atomic="true" className="min-h-[240px] flex flex-col items-center justify-center">
        <blockquote
          className={[
            `mx-auto max-w-4xl font-display italic text-display-md ${quoteColor}`,
            'transition-all duration-300 ease-in-out',
            transitioning
              ? 'translate-y-2 opacity-0'
              : 'translate-y-0 opacity-100',
          ].join(' ')}
        >
          <span aria-hidden="true" className="text-accent-gold">&ldquo;</span>
          {testimonial.quote}
          <span aria-hidden="true" className="text-accent-gold">&rdquo;</span>
        </blockquote>

        {/* Author name */}
        <p
          className={[
            `mt-6 font-mono text-label font-medium ${metaColor}`,
            'transition-all duration-300 ease-in-out',
            transitioning ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
          ].join(' ')}
        >
          &mdash; {testimonial.name}
        </p>

        {/* Location badge */}
        <span
          className={[
            'mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent-gold/60 px-3 py-1 font-mono text-base uppercase tracking-widest text-accent-gold',
            'transition-all duration-300 ease-in-out',
            transitioning ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
          ].join(' ')}
        >
          <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5Z" />
            <circle cx="8" cy="6" r="1.5" />
          </svg>
          {testimonial.location}
        </span>
      </div>

      {/* Navigation arrows */}
      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dot indicators — each button keeps a >=24px tap target via padding,
            while the visible dot itself stays small (span inside). */}
        <div className="flex items-center">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className="flex items-center justify-center p-2"
            >
              <span
                className={[
                  'block h-2 rounded-full transition-all duration-300',
                  i === current
                    ? 'w-6 bg-accent-gold'
                    : 'w-2 bg-border hover:bg-text-muted',
                ].join(' ')}
              />
            </button>
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
