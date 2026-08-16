'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface HeroPrintStackProps {
  images: string[];
}

const SWAP_MS = 7000;

// A loose fan of three real portfolio pieces, positioned like prints set out
// on a table rather than a full-bleed background. Motion is deliberately
// minimal — each card only floats a few pixels — because this stack sits
// beside the headline, not behind it, and doesn't need to fight for
// attention the way the old full-bleed slideshow did.
const SLOTS = [
  { rotate: -7, x: -20, y: 8, z: 0 },
  { rotate: 5, x: 20, y: 24, z: 1 },
  { rotate: -1.5, x: 0, y: 0, z: 2 },
] as const;

export default function HeroPrintStack({ images }: HeroPrintStackProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slotImage, setSlotImage] = useState<number[]>(() =>
    SLOTS.map((_, i) => i % Math.max(images.length, 1))
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (images.length <= SLOTS.length || reducedMotion) return;
    let cursor = SLOTS.length;
    const timer = setInterval(() => {
      const slot = cursor % SLOTS.length;
      const image = cursor % images.length;
      setSlotImage((prev) => {
        const next = [...prev];
        next[slot] = image;
        return next;
      });
      cursor++;
    }, SWAP_MS);
    return () => clearInterval(timer);
  }, [images.length, reducedMotion]);

  if (images.length === 0) {
    return (
      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-xs border border-border"
        style={{ background: 'linear-gradient(160deg, #F7F4EF 0%, #FAF8F5 50%, #F0EAE0 100%)' }}
      />
    );
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(198,168,92,0.18) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {SLOTS.map((slot, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            zIndex: slot.z,
            transform: `translate(-50%, -50%) translate(${slot.x}%, ${slot.y}%) rotate(${slot.rotate}deg)`,
          }}
        >
          <div
            className={reducedMotion ? undefined : 'hero-print-float'}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            <div className="relative aspect-[3/4] w-36 overflow-hidden border border-border bg-bg-primary shadow-[0_18px_44px_rgba(30,20,10,0.16)] sm:w-44 md:w-52">
              <Image
                key={images[slotImage[i]]}
                src={images[slotImage[i]]}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 45vw"
                priority={i === SLOTS.length - 1}
                className="object-cover hero-print-fade"
              />
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .hero-print-float {
          animation: hero-print-float 7s ease-in-out infinite;
        }
        .hero-print-fade {
          animation: hero-print-fade 900ms ease-out;
        }
        @keyframes hero-print-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes hero-print-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-print-fade {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
