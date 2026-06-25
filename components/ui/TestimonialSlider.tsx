'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { testimonials } from '@/lib/data';

const INTERVAL_MS = 6000;

export default function TestimonialSlider() {
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

  return (
    <div
      className="relative mx-auto max-w-5xl px-4 text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Quote region */}
      <div aria-live="polite" aria-atomic="true" className="min-h-[280px] flex flex-col items-center justify-center">
        <blockquote
          className={[
            'mx-auto max-w-4xl font-display italic text-display-md text-text-heading',
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

        <p
          className={[
            'mt-8 font-mono text-label text-text-muted',
            'transition-all duration-300 ease-in-out',
            transitioning
              ? 'translate-y-2 opacity-0'
              : 'translate-y-0 opacity-100',
          ].join(' ')}
        >
          &mdash; {testimonial.name}, {testimonial.location}
        </p>
      </div>

      {/* Navigation arrows */}
      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center border border-accent-gold text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
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

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={[
                'h-2 rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 bg-accent-gold'
                  : 'w-2 bg-border hover:bg-text-muted',
              ].join(' ')}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center border border-accent-gold text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
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
