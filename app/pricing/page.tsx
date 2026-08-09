'use client';

import { useEffect, useState } from 'react';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { readPortfolioCart, type PortfolioCartItem } from '@/utils/portfolio-cart';

export default function PricingPage() {
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);

  useEffect(() => {
    const updateCart = () => setCartItems(readPortfolioCart());
    updateCart();
    window.addEventListener('portfolio-cart-updated', updateCart);
    return () => window.removeEventListener('portfolio-cart-updated', updateCart);
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

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
                  ) : cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-display text-xl text-cat-heading">{item.title}</h3>
                        <p className="mt-1 font-body text-body-base text-cat-body">{item.category} · quantity {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-label uppercase tracking-wider text-cat-accent-dark">
                          £{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:border-accent-gold hover:text-accent-gold"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-cat-surface p-8 md:p-10">
                <p className="font-mono text-label uppercase tracking-wider text-cat-accent-dark">
                  Summary
                </p>
                <h3 className="mt-3 font-display text-2xl text-cat-heading">Estimated quote</h3>
                <div className="mt-8 space-y-4 border-t border-border pt-6">
                  <div className="flex items-center justify-between font-body text-body-base text-cat-body">
                    <span>Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-body text-body-base text-cat-body">
                    <span>VAT (20%)</span>
                    <span>£{tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-8 border-t border-border pt-6">
                  <div className="flex items-center justify-between font-display text-2xl text-cat-heading">
                    <span>Total</span>
                    <span>£{total.toFixed(2)}</span>
                  </div>
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
