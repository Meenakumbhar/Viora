'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface HeroVideoProps {
  src?: string;
  poster?: string;
  /** Static background photo shown whenever no video is playing (i.e. on
   *  pages with no `src` at all) — an alternative to the animated gradient,
   *  not tied to the video/reduced-motion fallback the way `poster` is. */
  image?: string;
  /** CSS object-position for `image`, tuned per-photo so the subject stays
   *  framed correctly once the container crops it. Defaults to a right-of-
   *  center bias, which suits a photo with its subject on the right. */
  imagePosition?: string;
  /** CSS background for the fade overlay sat on top of `image`. Defaults to
   *  a light feather that keeps a bright photo crisp. A photo with dark
   *  content behind the copy (e.g. soil, shadow) needs a stronger wash so
   *  the text stays legible — pass a heavier gradient in that case. */
  overlayGradient?: string;
  /** Tailwind min-height class for the section. Defaults to `min-h-[440px]`.
   *  A taller value gives a background photo more room before the bottom
   *  feather kicks in, so the fade stays a tight band at the very bottom
   *  edge instead of eating a large share of a short section. */
  minHeightClassName?: string;
  /** Tailwind padding classes for the content wrapper. Defaults to the
   *  standard px/pt/pb scale. Pass a larger pb-* to lift the text further
   *  off the bottom edge — useful when the photo has detail down there
   *  (e.g. soil, a busy foreground) the text would otherwise sit on top of. */
  contentPaddingClassName?: string;
  children: ReactNode;
}

const DEFAULT_OVERLAY =
  'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(253,252,250,0.08) 70%, rgba(253,252,250,0.22) 80%, rgba(253,252,250,0.55) 90%, #FDFCFA 100%)';

const DEFAULT_CONTENT_PADDING = 'px-6 pt-24 pb-16 md:px-12 md:pt-28 md:pb-24 lg:px-20 lg:pt-32 lg:pb-32';

export default function HeroVideo({
  src,
  poster,
  image,
  imagePosition = '78% 42%',
  overlayGradient = DEFAULT_OVERLAY,
  minHeightClassName = 'min-h-[440px]',
  contentPaddingClassName = DEFAULT_CONTENT_PADDING,
  children,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
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
  const showImage = !showVideo && !showPosterOnly && Boolean(image) && !imageFailed;

  return (
    <section className={`relative flex ${minHeightClassName} flex-col justify-end overflow-hidden`}>
      {/* Background — video, poster (reduced motion), static image, or animated warm light gradient */}
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
      ) : showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: imagePosition }}
          onError={() => setImageFailed(true)}
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

      {/* Gradient overlay — clear near the top so the photo stays crisp,
          then a gradual feather through the bottom so it dissolves into the
          section below rather than showing a hard edge. */}
      <div
        className="absolute inset-0"
        style={{ background: overlayGradient }}
      />

      {/* Content — bottom-aligned via the section's own flex layout, so it
          grows the section instead of clipping when a heading wraps to two
          lines (a fixed/capped height would push it up under the fixed nav). */}
      <div className={`relative z-10 ${contentPaddingClassName}`}>
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
