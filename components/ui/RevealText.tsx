'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface RevealTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export default function RevealText({ children, className = '', delay = 0 }: RevealTextProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('active');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  const words = children.match(/(?:<[^>]+>|[^ <]+)+/g) || [];

  return (
    <h2
      ref={ref}
      className={`reveal-text-container ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {words.map((word, wIdx) => (
        <span key={wIdx} className="reveal-word-wrapper mr-2">
          <span
            className="reveal-word"
            style={{ animationDelay: `${delay + wIdx * 55}ms` }}
            dangerouslySetInnerHTML={{ __html: word }}
          />
        </span>
      ))}
    </h2>
  );
}
