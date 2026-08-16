'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ProductData, ProductSize } from '@/types/database';
import { addToPortfolioCart } from '@/utils/portfolio-cart';
import { categoryToServiceLabel } from '@/lib/active-services';

export default function ProductOrderPanel({ product }: { product: ProductData }) {
  const [selected, setSelected] = useState<ProductSize>(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const hasMultipleSizes = product.sizes.length > 1;

  function addItem() {
    const cartId = `${product.slug}::${selected.label}`;
    const cartTitle = hasMultipleSizes ? `${product.title} — ${selected.label}` : product.title;
    for (let index = 0; index < quantity; index += 1) {
      addToPortfolioCart({
        id: cartId,
        title: cartTitle,
        category: 'Memorial keepsake',
        image: product.image ?? undefined,
        size: selected.label,
        serviceType: categoryToServiceLabel(product.category) ?? undefined,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div>
      {hasMultipleSizes && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-cat-muted">Choose a size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setSelected(size)}
                aria-pressed={selected.label === size.label}
                className={[
                  'border px-4 py-2 font-body text-sm transition-all duration-200',
                  selected.label === size.label
                    ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                    : 'border-border bg-cat-surface text-cat-heading hover:border-accent-gold',
                ].join(' ')}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={hasMultipleSizes ? 'mt-6 border-t border-border pt-6' : ''}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-cat-muted">Size</p>
        <p className="mt-2 font-body text-cat-body">{selected.dimensions}</p>
        {selected.description && (
          <p className="mt-3 font-body text-sm leading-relaxed text-cat-body">{selected.description}</p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <span className="font-body text-cat-body">Quantity</span>
        <div className="flex items-center border border-border">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 text-cat-heading">−</button>
          <span className="w-10 text-center font-mono text-sm">{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-11 w-11 text-cat-heading">+</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addItem}
          className="flex-1 border border-cat-accent bg-cat-accent px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-cat-bg hover:bg-cat-accent-dark"
        >
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
        <Link
          href="/pricing"
          onClick={addItem}
          className="flex-1 border border-cat-heading px-6 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-cat-heading hover:bg-cat-heading hover:text-cat-bg"
        >
          Checkout
        </Link>
      </div>
      <p className="mt-3 font-mono text-[10px] text-cat-muted">No price shown here — every project is quoted individually once we&apos;ve reviewed your details.</p>
    </div>
  );
}
