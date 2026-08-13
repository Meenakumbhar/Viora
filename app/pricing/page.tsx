'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import {
  readPortfolioCart,
  removeFromPortfolioCart,
  updatePortfolioCartQuantity,
  type PortfolioCartItem,
} from '@/utils/portfolio-cart';

export default function PricingPage() {
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateCart = () => setCartItems(readPortfolioCart());
    updateCart();
    window.addEventListener('portfolio-cart-updated', updateCart);
    return () => window.removeEventListener('portfolio-cart-updated', updateCart);
  }, []);

  return (
    <div>
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Quote cart
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Review your <em className="italic text-accent-gold">ordered items</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          This lightweight cart keeps your chosen pieces together so you can review them before requesting a final quote.
        </p>
      </HeroVideo>

      <section className="border-t border-border bg-cat-bg py-24 md:py-36 transition-colors duration-500">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.5fr_0.8fr]">
              <div className="rounded-[2rem] border border-border bg-cat-surface p-8 md:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-label uppercase tracking-wider text-cat-accent-dark">
                      Selected items
                    </p>
                    <h2 className="mt-2 font-display text-3xl text-cat-heading">
                      Your quote request
                    </h2>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 font-mono text-label uppercase tracking-wider text-text-muted">
                    {cartItems.length} items
                  </span>
                </div>

                <div className="mt-8 space-y-4">
                  {cartItems.length === 0 ? (
                    <p className="font-body text-body-base text-cat-muted">Your cart is empty. Add a portfolio asset to begin.</p>
                  ) : cartItems.map((item) => {
                    // Product cart entries use a composite `slug::size` id so
                    // each size of the same product stays a distinct line —
                    // portfolio entries just use the item's own real id.
                    const productSlug = item.id.includes('::') ? item.id.split('::')[0] : null;
                    const reviewHref = productSlug ? `/products/${productSlug}` : `/portfolio/${item.id}`;
                    const isExpanded = expandedIds.has(item.id);
                    return (
                    <div key={item.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setExpandedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                              return next;
                            })}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? `Hide larger preview of ${item.title}` : `Show larger preview of ${item.title}`}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-cat-bg transition-opacity hover:opacity-80"
                          >
                            {item.image ? (
                              <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="font-display text-lg font-bold text-cat-heading opacity-10">{item.title.charAt(0)}</span>
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-tl bg-black/55 text-white">
                              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                {isExpanded ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />}
                              </svg>
                            </span>
                          </button>
                          <div>
                            <h3 className="font-display text-xl text-cat-heading">{item.title}</h3>
                            <p className="mt-1 font-body text-body-base text-cat-body">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => setCartItems(updatePortfolioCartQuantity(item.id, item.quantity - 1))}
                              aria-label={`Decrease quantity of ${item.title}`}
                              className="flex h-9 w-9 items-center justify-center text-cat-heading transition-colors hover:text-accent-gold"
                            >
                              &minus;
                            </button>
                            <span className="w-8 text-center font-mono text-sm text-cat-heading">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setCartItems(updatePortfolioCartQuantity(item.id, item.quantity + 1))}
                              aria-label={`Increase quantity of ${item.title}`}
                              className="flex h-9 w-9 items-center justify-center text-cat-heading transition-colors hover:text-accent-gold"
                            >
                              +
                            </button>
                          </div>
                          <Link
                            href={reviewHref}
                            className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                          >
                            Review
                          </Link>
                          <button
                            type="button"
                            onClick={() => setCartItems(removeFromPortfolioCart(item.id))}
                            aria-label={`Remove ${item.title} from cart`}
                            className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-[#7A4A44] hover:text-[#7A4A44]"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <Link
                          href={reviewHref}
                          className="group mt-4 flex items-center gap-4 rounded-2xl border border-border bg-cat-bg p-3 transition-colors hover:border-accent-gold animate-fadeIn"
                        >
                          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-cat-surface">
                            {item.image ? (
                              <Image src={item.image} alt={item.title} fill sizes="112px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="font-display text-3xl font-bold text-cat-heading opacity-10">{item.title.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-cat-accent-dark group-hover:text-accent-gold">
                            View product &rarr;
                          </span>
                        </Link>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-cat-surface p-8 md:p-10">
                <p className="font-mono text-label uppercase tracking-wider text-cat-accent-dark">
                  Summary
                </p>
                <h3 className="mt-3 font-display text-2xl text-cat-heading">Ready to request pricing?</h3>
                <div className="mt-8 border-t border-border pt-6">
                  <p className="font-body text-body-base text-cat-body leading-relaxed">
                    Every project is priced individually once we&apos;ve reviewed your details — send us your selected items and we&apos;ll come back with a real quote, not an estimate.
                  </p>
                  <div className="mt-8">
                    <Button variant="primary" size="lg" href="/contact">
                      Request a final quote
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>
    </div>
  );
}
