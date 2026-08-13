'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PortfolioItem } from '@/types/database';
import { addToPortfolioCart } from '@/utils/portfolio-cart';
import { isItemSaved, toggleSavedItem } from '@/utils/portfolio-saved';
import { categoryToServiceLabel } from '@/lib/active-services';

export default function PortfolioProject({ item }: { item: PortfolioItem }) {
  const images = useMemo(
    () => item.image_urls?.length ? item.image_urls : [item.image_url],
    [item.image_urls, item.image_url]
  );
  const [activeImage, setActiveImage] = useState(0);
  const [imageErrored, setImageErrored] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isItemSaved(item.id));
  }, [item.id]);

  function moveImage(direction: number) {
    setImageErrored(false);
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  function addItem() {
    for (let index = 0; index < quantity; index += 1) {
      addToPortfolioCart({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image_url,
        serviceType: categoryToServiceLabel(item.category) ?? undefined,
      });
    }
  }

  function handleToggleSave() {
    toggleSavedItem({ id: item.id, title: item.title, category: item.category, image: item.image_url });
    setSaved((current) => !current);
  }

  return (
    <main className="bg-[#FDFCFA] pb-24 pt-28 text-[#1C2530]">
      <div className="container-wide">
        <Link href="/portfolio" className="font-mono text-[10px] uppercase tracking-widest text-[#5B6470] hover:text-[#1C2530]">
          ← Back to portfolio
        </Link>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <section>
            <div className="relative overflow-hidden border border-border bg-cat-surface">
              <div className="relative aspect-[4/3] w-full">
                {images[activeImage] && !imageErrored ? (
                  <Image
                    src={images[activeImage]}
                    alt={item.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain"
                    onError={() => setImageErrored(true)}
                  />
                ) : null}
              </div>
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => moveImage(-1)} aria-label="Previous project image" className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-white/60 bg-black/30 text-white backdrop-blur">←</button>
                  <button type="button" onClick={() => moveImage(1)} aria-label="Next project image" className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full border border-white/60 bg-black/30 text-white backdrop-blur">→</button>
                </>
              )}
            </div>
            {images.length > 1 && <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-cat-muted">{activeImage + 1} / {images.length} views</p>}
          </section>

          <section>
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B5420]">{item.category}</span>
              <button
                type="button"
                onClick={handleToggleSave}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from saved items' : 'Save this item'}
                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#5B6470] transition-colors hover:text-[#7A4A44]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill={saved ? '#7A4A44' : 'none'}
                  stroke={saved ? '#7A4A44' : 'currentColor'}
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5s-7.5-4.6-10-9.3C.4 8 1.8 4.5 5 3.6c2-.5 3.9.3 5 2 1.1-1.7 3-2.5 5-2 3.2.9 4.6 4.4 3 7.6-2.5 4.7-10 9.3-10 9.3Z" />
                </svg>
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
            <h1 className="mt-4 font-display text-5xl leading-none text-[#1C2530] md:text-7xl">{item.title}</h1>
            <p className="mt-6 font-body text-body-lg leading-relaxed text-[#374151]">{item.description ?? 'A considered design from our studio portfolio.'}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {Object.values(item.filters ?? {}).flat().map((value) => <span key={value} className="border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-cat-muted">{value}</span>)}
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cat-muted">Request this piece</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-body text-cat-body">Quantity</span>
                <div className="flex items-center border border-border">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 text-cat-heading">−</button>
                  <span className="w-10 text-center font-mono text-sm">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-11 w-11 text-cat-heading">+</button>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={addItem} className="flex-1 border border-cat-accent bg-cat-accent px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-cat-bg hover:bg-cat-accent-dark">Add to cart</button>
                <Link href="/pricing" onClick={addItem} className="flex-1 border border-cat-heading px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-cat-heading hover:bg-cat-heading hover:text-cat-bg">Checkout</Link>
              </div>
              <p className="mt-3 font-mono text-[10px] text-cat-muted">No price shown here — every project is quoted individually once we&apos;ve reviewed your details.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
