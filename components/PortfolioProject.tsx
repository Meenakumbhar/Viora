'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PortfolioItem } from '@/types/database';
import { addToPortfolioCart } from '@/utils/portfolio-cart';

export default function PortfolioProject({ item }: { item: PortfolioItem }) {
  const images = useMemo(
    () => item.image_urls?.length ? item.image_urls : [item.image_url],
    [item.image_urls, item.image_url]
  );
  const [activeImage, setActiveImage] = useState(0);
  const [imageErrored, setImageErrored] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const unitPrice = 95;
  const subtotal = unitPrice * quantity;
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

  function moveImage(direction: number) {
    setImageErrored(false);
    setActiveImage((current) => (current + direction + images.length) % images.length);
  }

  function addItem() {
    for (let index = 0; index < quantity; index += 1) {
      addToPortfolioCart({ id: item.id, title: item.title, category: item.category, unitPrice });
    }
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
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B5420]">{item.category}</span>
            <h1 className="mt-4 font-display text-5xl leading-none text-[#1C2530] md:text-7xl">{item.title}</h1>
            <p className="mt-6 font-body text-body-lg leading-relaxed text-[#374151]">{item.description ?? 'A considered design from our studio portfolio.'}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {Object.values(item.filters ?? {}).flat().map((value) => <span key={value} className="border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-cat-muted">{value}</span>)}
            </div>

            <div className="mt-12 border-t border-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cat-muted">Estimated purchase</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-body text-cat-body">Quantity</span>
                <div className="flex items-center border border-border">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 text-cat-heading">−</button>
                  <span className="w-10 text-center font-mono text-sm">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-11 w-11 text-cat-heading">+</button>
                </div>
              </div>
              <div className="mt-6 space-y-3 border-t border-border pt-5 font-mono text-xs text-cat-body">
                <div className="flex justify-between"><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>VAT (20%)</span><span>£{tax.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-3 text-base text-cat-heading"><span>Estimated total</span><span>£{total.toFixed(2)}</span></div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={addItem} className="flex-1 border border-cat-accent bg-cat-accent px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-cat-bg hover:bg-cat-accent-dark">Add to cart</button>
                <Link href="/pricing" onClick={addItem} className="flex-1 border border-cat-heading px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-cat-heading hover:bg-cat-heading hover:text-cat-bg">Checkout</Link>
              </div>
              <p className="mt-3 font-mono text-[10px] text-cat-muted">Estimate only. Final production and delivery costs are confirmed before payment.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
