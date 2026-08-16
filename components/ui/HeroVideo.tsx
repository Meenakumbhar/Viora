'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface HeroVideoProps {
  src?: string;
  poster?: string;
  children: ReactNode;
}

export default function HeroVideo({ src, poster, children }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // A fast failure (e.g. a 404 on the video file) can fire the native error
  // event before React finishes attaching the onError handler below, so it
  // gets missed — same class of bug as a cached-image load firing early.
  // Checking .error directly once mounted, plus a native listener as backup,
  // catches it either way.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.error) {
      setVideoFailed(true);
      return;
    }
    const handleNativeError = () => setVideoFailed(true);
    el.addEventListener('error', handleNativeError);
    return () => el.removeEventListener('error', handleNativeError);
  }, [src]);

  // Someone who's asked their OS not to autoplay motion gets the poster (if
  // any) instead — same visual moment, no movement. A video that fails to
  // load (wrong path, file not added yet) falls back to the gradient rather
  // than showing a broken/black rectangle.
  const showVideo = Boolean(src) && !videoFailed && !reducedMotion;
  const showPosterOnly = Boolean(src) && !videoFailed && reducedMotion && Boolean(poster);

  return (
    <section className="relative min-h-svh overflow-hidden">
      {/* Background — video, poster (reduced motion), or animated warm light gradient */}
      {showVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : showPosterOnly ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
