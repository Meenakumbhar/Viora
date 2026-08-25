'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { EffectivePrice } from '@/types/database';
import { formatPrice } from '@/lib/format';

export default function PricingPage() {
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // A logged-in customer already has their contact details on file, so their
  // cart should funnel into the lightweight /account/quote form rather than
  // the full guest enquiry form.
  const [loggedIn, setLoggedIn] = useState(false);
  // A logged-in customer sees a price here once one exists — their own
  // negotiated price, or the price set on the exact piece in their cart.
  // Logged-out visitors see neither; this is unchanged for them. Keyed by
  // cart item id so a multi-item cart (e.g. a portfolio template plus a
  // product) can price each line independently rather than only ever
  // resolving a price for a cart of exactly one item.
  const [pricesByItemId, setPricesByItemId] = useState<Map<string, EffectivePrice | null>>(new Map());
  const [priceLoaded, setPriceLoaded] = useState(false);

  useEffect(() => {
    const updateCart = () => setCartItems(readPortfolioCart());
    updateCart();
    window.addEventListener('portfolio-cart-updated', updateCart);
    return () => window.removeEventListener('portfolio-cart-updated', updateCart);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/me')
      .then((res) => { if (!cancelled) setLoggedIn(res.ok); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // A single cart item is either a real portfolio item (its own id, no
  // `::`) or a product cart entry (carries productId + a size label in
  // `size`) — build whichever query string applies to look up its price, or
  // null if it's not a priceable item at all.
  function pricingParamsFor(item: PortfolioCartItem): string | null {
    if (item.productId) {
      return item.size ? `?productId=${encodeURIComponent(item.productId)}&sizeLabel=${encodeURIComponent(item.size)}` : null;
    }
    return item.id.includes('::') ? null : `?portfolioItemId=${encodeURIComponent(item.id)}`;
  }

  // Every cart item gets its own price lookup — not just when the cart
  // happens to hold exactly one item — so a total can be shown even when a
  // portfolio template and a product are both in the cart together.
  useEffect(() => {
    if (!loggedIn || cartItems.length === 0) {
      // Syncing from an external system (login status/cart contents), not
      // deriving from React state — the legitimate exception this rule allows for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPricesByItemId(new Map());
      setPriceLoaded(cartItems.length === 0);
      return;
    }
    let cancelled = false;
    setPriceLoaded(false);
    Promise.all(
      cartItems.map(async (item) => {
        const params = pricingParamsFor(item);
        if (!params) return [item.id, null] as const;
        try {
          const res = await fetch(`/api/account/pricing${params}`);
          const json = res.ok ? await res.json() : { success: false };
          return [item.id, json.success ? (json.data as EffectivePrice | null) : null] as const;
        } catch {
          return [item.id, null] as const;
        }
      })
    ).then((entries) => {
      if (!cancelled) setPricesByItemId(new Map(entries));
    }).finally(() => {
      if (!cancelled) setPriceLoaded(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on item ids/quantities via the join below, not the array reference, which would refetch every render.
  }, [loggedIn, cartItems.map((i) => `${i.id}:${i.quantity}`).join(',')]);

  const priceSummary = useMemo(() => {
    let total = 0;
    let pricedCount = 0;
    let allNegotiated = true;
    for (const item of cartItems) {
      const price = pricesByItemId.get(item.id);
      if (!price) continue;
      total += price.price * item.quantity;
      pricedCount += 1;
      if (!price.negotiated) allNegotiated = false;
    }
    return {
      total,
      pricedCount,
      unpricedCount: cartItems.length - pricedCount,
      negotiated: allNegotiated && pricedCount > 0,
      currency: cartItems.map((i) => pricesByItemId.get(i.id)?.currency).find(Boolean) ?? 'GBP',
    };
  }, [cartItems, pricesByItemId]);

  return (
    <div>
      <HeroVideo poster="/images/Pricing_banner.jpg">
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Quote cart
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Review your <em className="not-italic font-semibold text-accent-gold">ordered items</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          This lightweight cart keeps your chosen pieces together so you can review them before requesting a final quote.
        </p>
      </HeroVideo>

      {/* Top padding trimmed from the bottom's: HeroVideo above already ends
          in its own pb-16/24/32 + gradient fade, so a full py-16/24/28 here
          on top of that read as a dead gap before the cart card. */}
      <section className="border-t border-border bg-cat-bg pt-10 pb-16 md:pt-14 md:pb-24 lg:pt-20 lg:pb-28 transition-colors duration-500">
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
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value, 10);
                                setCartItems(updatePortfolioCartQuantity(item.id, Number.isFinite(parsed) && parsed > 0 ? parsed : 1));
                              }}
                              aria-label={`Quantity of ${item.title}`}
                              className="w-12 border-0 bg-transparent text-center font-mono text-base text-cat-heading [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
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
                            className="rounded-full border border-border px-3 py-1 font-mono text-base uppercase tracking-wider text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                          >
                            Review
                          </Link>
                          <button
                            type="button"
                            onClick={() => setCartItems(removeFromPortfolioCart(item.id))}
                            aria-label={`Remove ${item.title} from cart`}
                            className="rounded-full border border-border px-3 py-1 font-mono text-base uppercase tracking-wider text-text-muted transition-colors hover:border-[#7A4A44] hover:text-[#7A4A44]"
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
                          <span className="font-mono text-base uppercase tracking-widest text-cat-accent-dark group-hover:text-accent-gold">
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

                  {/* Logged-in customers always see this block — a running
                      total across every priceable line in the cart (their
                      own negotiated price where one's been set, otherwise
                      the item's shared baseline), plus a note for anything
                      still unpriced. Never a blank or £0 total. Logged-out
                      visitors see none of this. */}
                  {loggedIn && priceLoaded && cartItems.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-accent-gold/40 bg-accent-gold/5 p-5">
                      {priceSummary.pricedCount > 0 ? (
                        <>
                          <p className="font-mono text-base uppercase tracking-widest text-accent-gold">
                            {priceSummary.negotiated ? 'Your total' : 'Estimated total'}
                          </p>
                          <p className="mt-1.5 font-display text-3xl text-cat-heading">
                            {formatPrice(priceSummary.total, priceSummary.currency)}
                          </p>
                          <p className="mt-2 font-body text-base text-cat-muted">
                            {priceSummary.negotiated
                              ? 'This is the price we agreed for your project.'
                              : 'A general starting estimate — your final price is confirmed once we’ve reviewed your specific request.'}
                          </p>
                          {priceSummary.unpricedCount > 0 && (
                            <p className="mt-2 font-mono text-base text-cat-muted">
                              + {priceSummary.unpricedCount} item{priceSummary.unpricedCount > 1 ? 's' : ''} still being priced individually
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-mono text-base uppercase tracking-widest text-accent-gold">Pricing</p>
                          <p className="mt-1.5 font-body text-body-base text-cat-heading">
                            Your custom pricing is being prepared — we&apos;ll let you know as soon as it&apos;s ready.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-8">
                    <Button variant="primary" size="lg" href={loggedIn ? '/account/quote?cart=1' : '/contact?cart=1'}>
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
