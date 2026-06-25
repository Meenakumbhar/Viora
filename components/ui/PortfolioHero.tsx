'use client';

import { useMemo } from 'react';

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
    eyebrow: 'Studio Case Studies',
    headline: 'Print that',
    headlineAccent: 'speaks',
    description:
      'A curated selection of our wedding suites, celebration of life books, sports programmes, and branding designs delivered to clients globally.',
    bgGradient:
      'linear-gradient(135deg, #F7F4EF 0%, #FAF8F5 30%, #FDFCFA 60%, #F7F4EF 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(253,252,250,0.6) 65%, #FDFCFA 100%)',
  },
  wedding: {
    eyebrow: 'Wedding Portfolio',
    headline: 'Stationery for your',
    headlineAccent: 'forever',
    description:
      'Invitation suites, orders of service, table plans, and bespoke signage — each piece crafted to mirror the joy of the day.',
    bgGradient:
      'linear-gradient(135deg, #FDF7F5 0%, #F5E6DF 30%, #E8D5C4 60%, #FDF7F5 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(253,247,245,0.6) 65%, #FDF7F5 100%)',
  },
  funeral: {
    eyebrow: 'Memorial Portfolio',
    headline: 'Print that honours a',
    headlineAccent: 'life',
    description:
      'Orders of service, memorial cards, and keepsake books — handled with warmth, care, and unhurried attention to detail.',
    bgGradient:
      'linear-gradient(135deg, #F8F7FD 0%, #EDEAF8 30%, #D6D3EE 60%, #F8F7FD 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(248,247,253,0.6) 65%, #F8F7FD 100%)',
  },
  events: {
    eyebrow: 'Events Portfolio',
    headline: 'Print that sets the',
    headlineAccent: 'scene',
    description:
      'Invitations, programmes, signage, and keepsakes for celebrations, galas, and gatherings that deserve memorable details.',
    bgGradient:
      'linear-gradient(135deg, #FDFAF5 0%, #F8EDDA 30%, #F5DFB8 60%, #FDFAF5 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(253,250,245,0.6) 65%, #FDFAF5 100%)',
  },
  sports: {
    eyebrow: 'Sports Portfolio',
    headline: 'Print built for the',
    headlineAccent: 'pitch',
    description:
      'Matchday programmes, team branding, sponsor packs, and event signage — confident, sharp, and built to perform.',
    bgGradient:
      'linear-gradient(135deg, #F4FAF0 0%, #E2F0DB 30%, #C2DCBB 60%, #F4FAF0 100%)',
    overlayGradient:
      'linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(244,250,240,0.6) 65%, #F4FAF0 100%)',
  },
  branding: {
    eyebrow: 'Branding Portfolio',
    headline: 'Identity designed to',
    headlineAccent: 'endure',
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
  const content = useMemo(() => {
    const key = activeCategory.toLowerCase();
    return categoryContentMap[key] || categoryContentMap.all;
  }, [activeCategory]);

  return (
    <section
      data-category={activeCategory.toLowerCase()}
      className="relative min-h-[70vh] overflow-hidden transition-colors duration-700"
    >
      {/* Background — animated light gradient per category */}
      <div
        className="absolute inset-0 h-full w-full transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: content.bgGradient,
          backgroundSize: '400% 400%',
          animation: 'hero-gradient-shift 12s ease infinite',
        }}
      />

      {/* Gradient overlay — smooth bottom transition */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          backgroundImage: content.overlayGradient,
        }}
      />

      {/* Content positioned at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-16 md:px-12 md:pb-24 lg:px-20 lg:pb-32">
        <span
          className="block font-mono text-label uppercase tracking-wider text-accent-gold transition-opacity duration-500"
          key={`eyebrow-${activeCategory}`}
        >
          {content.eyebrow}
        </span>
        <h1
          className="mt-4 font-display text-display-xl text-cat-heading max-w-4xl transition-opacity duration-500"
          key={`headline-${activeCategory}`}
        >
          {content.headline}{' '}
          <em className="italic text-accent-gold">{content.headlineAccent}</em>
        </h1>
        <p
          className="mt-6 font-body text-body-lg text-cat-body max-w-2xl leading-relaxed transition-opacity duration-500"
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
