'use client';

import type { ReactNode } from 'react';

interface HeroVideoProps {
  src?: string;
  poster?: string;
  children: ReactNode;
}

export default function HeroVideo({ src, poster, children }: HeroVideoProps) {
  return (
    <section className="relative min-h-svh overflow-hidden">
      {/* Background — video or animated warm light gradient */}
      {src ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 h-full"
            style={{
              width: '200%',
              background:
                'linear-gradient(135deg, #F7F4EF 0%, #FAF8F5 25%, #FDFCFA 50%, #FAF8F5 75%, #F7F4EF 100%)',
              animation: 'hero-gradient-shift 12s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}

      {/* Gradient overlay — transparent top, solid warm bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(253,252,250,0.6) 65%, #FDFCFA 100%)',
        }}
      />

      {/* Content positioned at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-16 md:px-12 md:pb-24 lg:px-20 lg:pb-32">
        {children}
      </div>

      {/* Inline keyframes for the animated gradient */}
      <style jsx>{`
        @keyframes hero-gradient-shift {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-25%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}
