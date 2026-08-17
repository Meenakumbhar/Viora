'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const gallery = useMemo(() => images.filter(Boolean), [images]);
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState(false);

  function move(direction: number) {
    setErrored(false);
    setActive((current) => (current + direction + gallery.length) % gallery.length);
  }

  return (
    <section className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-cat-surface">
      {gallery[active] && !errored ? (
        <Image
          src={gallery[active]}
          alt={gallery.length > 1 ? `${title} — ${active + 1} of ${gallery.length}` : title}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-display text-8xl font-bold text-cat-heading opacity-[0.06]">
            {title.charAt(0)}
          </span>
        </div>
      )}

      {gallery.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-white/60 bg-black/30 text-white backdrop-blur"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-white/60 bg-black/30 text-white backdrop-blur"
          >
            →
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur">
            {active + 1} / {gallery.length}
          </span>
        </>
      )}
    </section>
  );
}
