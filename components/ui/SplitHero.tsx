import Image from 'next/image';
import type { ReactNode } from 'react';
import Button from '@/components/ui/Button';

/* ═══════════════════════════════════════════════════════════════════════════
   SPLIT HERO — solid pastel text panel + full-bleed photo, thin ring
   decoration over the image. One reusable pattern for the homepage hero
   and page-top heroes, cycling through a small set of muted panel tones
   so different sections/pages read as distinct without ever going vivid —
   deliberately restrained for a wedding/funeral audience.
   ═══════════════════════════════════════════════════════════════════════════ */

export const PANEL_TONES = {
  sand: { bg: '#EDE6DA', heading: '#3A3128', body: '#6B6153' },
  sage: { bg: '#E3E8DE', heading: '#2E3B2A', body: '#5C6857' },
  mist: { bg: '#E1E5EA', heading: '#26313D', body: '#54606C' },
  blush: { bg: '#EFE2DE', heading: '#3F2C26', body: '#6E5850' },
  lilac: { bg: '#E7E2E8', heading: '#332B3B', body: '#645A6C' },
} as const;

export type PanelTone = keyof typeof PANEL_TONES;

interface SplitHeroProps {
  tone?: PanelTone;
  eyebrow?: string;
  heading: ReactNode;
  description?: ReactNode;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  image: { src: string; alt: string; position?: string };
  imageLeft?: boolean;
  rings?: boolean;
  minHeight?: string;
}

function RingDecoration() {
  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-40 md:h-80 md:w-80"
    >
      <circle cx="200" cy="200" r="150" fill="none" stroke="#FDFCFA" strokeWidth="1" />
      <circle cx="120" cy="260" r="90" fill="none" stroke="#FDFCFA" strokeWidth="1" />
    </svg>
  );
}

export default function SplitHero({
  tone = 'sand',
  eyebrow,
  heading,
  description,
  primaryCta,
  secondaryCta,
  image,
  imageLeft = false,
  rings = true,
  minHeight = 'min-h-[520px] lg:min-h-[600px]',
}: SplitHeroProps) {
  const palette = PANEL_TONES[tone];

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: palette.bg }}>
      <div className={`grid grid-cols-1 lg:grid-cols-2 items-stretch ${minHeight}`}>
        {/* Text panel */}
        <div
          className={`flex flex-col justify-center px-6 py-16 md:px-12 lg:py-0 ${
            imageLeft ? 'lg:order-2 lg:pl-12 lg:pr-20' : 'lg:order-1 lg:pl-20 lg:pr-12'
          }`}
        >
          {eyebrow && (
            <span
              className="font-mono text-label uppercase tracking-wider"
              style={{ color: palette.body }}
            >
              {eyebrow}
            </span>
          )}
          <h1
            className="mt-4 font-display text-display-xl max-w-xl"
            style={{ color: palette.heading }}
          >
            {heading}
          </h1>
          {description && (
            <p
              className="mt-6 max-w-lg font-body text-body-lg leading-relaxed"
              style={{ color: palette.body }}
            >
              {description}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-4">
              {primaryCta && (
                <Button variant="primary" size="lg" href={primaryCta.href} className="rounded-full">
                  {primaryCta.label}
                </Button>
              )}
              {secondaryCta && (
                <Button
                  variant="ghost"
                  size="lg"
                  href={secondaryCta.href}
                  className="rounded-full"
                  style={{ borderColor: palette.heading, color: palette.heading }}
                >
                  {secondaryCta.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Photo panel — bleeds to the viewport edge, rounded on the side facing the text */}
        <div
          className={`relative order-first aspect-[4/3] overflow-hidden lg:aspect-auto ${
            imageLeft
              ? 'lg:order-1 rounded-b-[2.5rem] lg:rounded-b-none lg:rounded-r-[3rem]'
              : 'lg:order-2 rounded-b-[2.5rem] lg:rounded-b-none lg:rounded-l-[3rem]'
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition: image.position ?? 'center' }}
          />
          {rings && <RingDecoration />}
        </div>
      </div>
    </section>
  );
}
