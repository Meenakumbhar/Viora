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
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            background: [
              'linear-gradient(135deg, #F7F4EF 0%, #FAF8F5 30%, #FDFCFA 60%, #F7F4EF 100%)',
            ].join(', '),
            backgroundSize: '400% 400%',
            animation: 'hero-gradient-shift 12s ease infinite',
          }}
        />
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
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </section>
  );
}
