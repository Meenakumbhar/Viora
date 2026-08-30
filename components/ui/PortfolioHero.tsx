'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import HeroDoodles from '@/components/ui/HeroDoodles';
import PortfolioPrintArt from '@/components/ui/PortfolioPrintArt';

// No category currently uses a background video — funeral now uses the
// static Portfolio-funeral-Image.jpg (see CATEGORY_IMAGES) instead of the
// NEXT_PUBLIC_FUNERAL_HERO_VIDEO_URL video it used before. Add a category
// key here to bring video back for a given category.
const CATEGORY_VIDEOS: Partial<Record<string, string>> = {};

// A static background photo per category — used whenever that category has
// no video (or the video fails to load). Falls back to the animated gradient
// for any category without one configured here.
const CATEGORY_IMAGES: Partial<Record<string, string>> = {
  all: '/images/Portfolio_banner.jpg',
  wedding: '/images/Wedding-Background.jpg',
  // Cropped from the original upload (Portfolio-funeral-Image.jpg) — that
  // photo's own sky fades to white well before the 100% mark, and this
  // hero's aspect ratio always renders its full height (no vertical crop
  // headroom to dodge the haze via object-position). This crop keeps the
  // vivid sky and the full dandelion, cutting most of the built-in fade
  // before it ever reaches the overlay.
  funeral: '/images/Portfolio-funeral-Image.jpg',
};

interface CategoryContent {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  description: string;
  bgGradient: string;
  overlayGradient: string;
}

const categoryContentMap: Record<string, CategoryContent> = {
  all: {
    eyebrow: '',
    headline: 'Print That',
    headlineAccent: 'Speaks',
    description:
      'A curated selection of our bespoke designs, wedding suites, celebration of life books, designs delivered to clients globally.',
    bgGradient:
      'linear-gradient(135deg, #F7F4EF 0%, #FAF8F5 30%, #FDFCFA 60%, #F7F4EF 100%)',
    overlayGradient: 'none',
  },
  funeral: {
    eyebrow: '',
    headline: 'Print That Honours a',
    headlineAccent: 'Life',
    description:
      'Orders of service, memorial cards, and keepsake books — handled with warmth, care, and unhurried attention to detail.',
    bgGradient:
      'linear-gradient(135deg, #FFFFFF 0%, #c5a34e 30%, #F3E7C9 60%, #FFFFFF 100%)',
    // No fade overlay, by request — the photo (Portfolio-funeral-Image.jpg)
    // crops straight into the section background with a hard edge. Note:
    // on a wide desktop viewport, object-cover crops more off the top/bottom
    // to fill the width, which cuts off this photo's own built-in fade
    // toward white near its bottom edge — the hard edge will show solid
    // sky-blue meeting the background there, not a blend.
    overlayGradient: 'none',
  },
  wedding: {
    eyebrow: '',
    headline: 'Stationery for Your',
    headlineAccent: 'Forever',
    description:
      'Invitation suites, orders of service, table plans, and bespoke signage — each piece crafted to mirror the joy of the day.',
    bgGradient:
      'linear-gradient(135deg, #FDF7F5 0%, #F5E6DF 30%, #E8D5C4 60%, #FDF7F5 100%)',
    // No fade overlay, by request — the illustration crops straight into
    // the section background with a hard edge.
    overlayGradient: 'none',
  },
  events: {
    eyebrow: 'Events Portfolio',
    headline: 'Print That Sets the',
    headlineAccent: 'Scene',
    description:
      'Invitations, programmes, signage, and keepsakes for celebrations, galas, and gatherings that deserve memorable details.',
    bgGradient:
      'linear-gradient(135deg, #FDFAF5 0%, #F8EDDA 30%, #F5DFB8 60%, #FDFAF5 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(253,250,245,0.6) 65%, #FDFAF5 100%)',
  },
  sports: {
    eyebrow: 'Sports Portfolio',
    headline: 'Print Built for the',
    headlineAccent: 'Pitch',
    description:
      'Matchday programmes, team branding, sponsor packs, and event signage — confident, sharp, and built to perform.',
    bgGradient:
      'linear-gradient(135deg, #F4FAF0 0%, #E2F0DB 30%, #C2DCBB 60%, #F4FAF0 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(244,250,240,0.6) 65%, #F4FAF0 100%)',
  },
  branding: {
    eyebrow: 'Branding Portfolio',
    headline: 'Identity Designed to',
    headlineAccent: 'Endure',
    description:
      'Logo systems, brand guidelines, stationery suites, and packaging — strategic design that builds recognition.',
    bgGradient:
      'linear-gradient(135deg, #F4F7FD 0%, #E0E8F8 30%, #C2D4EE 60%, #F4F7FD 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(244,247,253,0.6) 65%, #F4F7FD 100%)',
  },
};

interface PortfolioHeroProps {
  activeCategory: string;
}

export default function PortfolioHero({ activeCategory }: PortfolioHeroProps) {
  const key = activeCategory.toLowerCase();
  const content = useMemo(() => {
    return categoryContentMap[key] || categoryContentMap.all;
  }, [key]);

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

  // Reset the failure flag when switching categories, so leaving and coming
  // back to funeral gets a fresh attempt rather than being stuck on the
  // gradient from an earlier error.
  useEffect(() => {
    setVideoFailed(false);
  }, [key]);

  const videoSrc = CATEGORY_VIDEOS[key];
  const showVideo = Boolean(videoSrc) && !videoFailed && !reducedMotion;

  const imageSrc = CATEGORY_IMAGES[key];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !showVideo && Boolean(imageSrc) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [key]);

  // Same missed-event race as HeroVideo: a fast 404 can fire the native
  // error event before React attaches onError, so check directly too.
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
  }, [videoSrc]);

  return (
    <section
      data-category={activeCategory.toLowerCase()}
      className="relative min-h-[max(70vh,34rem)] overflow-hidden bg-cat-bg transition-colors duration-700"
    >
      {/* Background layers start below the fixed nav (h-20) plus a little
          breathing room, matching the homepage hero — so the nav always sits
          on this section's plain bg-cat-bg strip, never directly over the
          photo/video/gradient. */}
      {showVideo ? (
        <video
          ref={videoRef}
          key={videoSrc}
          className="absolute inset-x-0 top-24 bottom-0 h-[calc(100%-6rem)] w-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : showImage ? (
        <div className="absolute inset-x-0 top-24 bottom-0">
          <Image
            key={imageSrc}
            src={imageSrc!}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div
          className="absolute inset-x-0 top-24 bottom-0 transition-all duration-700 ease-in-out"
          style={{
            backgroundImage: content.bgGradient,
            backgroundSize: '400% 400%',
            animation: 'hero-gradient-shift 12s ease infinite',
          }}
        >
          <HeroDoodles />
          {key === 'all' && <PortfolioPrintArt />}
        </div>
      )}

      {/* Gradient overlay — smooth bottom transition */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          backgroundImage: content.overlayGradient,
        }}
      />

      {/* Content positioned at bottom — shifted up from the very edge so it
          sits better-balanced within the image instead of crammed against
          the bottom, and needs less opaque overlay behind it as a result. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 md:px-12 md:pb-16 lg:px-20 lg:pb-20">
        <span
          className="block font-mono text-label uppercase tracking-wider text-accent-gold transition-opacity duration-500"
          key={`eyebrow-${activeCategory}`}
        >
          {content.eyebrow}
        </span>
        <h1
          className={`mt-4 font-display text-display-lg max-w-4xl transition-opacity duration-500 ${key === 'funeral' ? 'text-white' : 'text-cat-heading'
            }`}
          key={`headline-${activeCategory}`}
        >
          {content.headline}{' '}
          <em
            className={`not-italic font-semibold ${key === 'funeral' ? 'text-cat-heading' : 'text-accent-gold'
              }`}
          >
            {content.headlineAccent}
          </em>
        </h1>
        <p
          className={`mt-6 font-body text-body-lg max-w-2xl leading-relaxed transition-opacity duration-500 ${key === 'funeral' ? 'text-cat-heading' : 'text-cat-body'
            }`}
          key={`desc-${activeCategory}`}
        >
          {content.description}
        </p>
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
