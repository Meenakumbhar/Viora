'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductSize, PortfolioItem } from '@/types/database';
import { addToPortfolioCart } from '@/utils/portfolio-cart';
import { categoryToServiceLabel } from '@/lib/active-services';

export default function ProductOrderPanel({
  product,
  templates = [],
}: {
  product: Product;
  templates?: PortfolioItem[];
}) {
  const [selected, setSelected] = useState<ProductSize>(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PortfolioItem | null>(null);
  const hasMultipleSizes = product.sizes.length > 1;
  // Portfolio titles are already prefixed with their own template number
  // (e.g. "165 - Canal Boats Cover") — strip that back off wherever we show
  // the number separately (as "#165") so it isn't printed twice.
  function titleWithoutTemplateNumber(item: PortfolioItem): string {
    if (!item.template_number) return item.title;
    return item.title.replace(new RegExp(`^\\s*${item.template_number}\\s*-\\s*`), '').trim() || item.title;
  }

  // Numeric where possible so "#9" sorts before "#10" instead of after it.
  const sortedTemplates = [...templates].sort((a, b) => {
    const numA = Number(a.template_number);
    const numB = Number(b.template_number);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return (a.template_number ?? '').localeCompare(b.template_number ?? '');
  });

  function addItem() {
    const cartId = [product.slug, selected.label, selectedTemplate?.template_number]
      .filter(Boolean)
      .join('::');
    const cartTitle = [
      product.title,
      selectedTemplate?.template_number ? `Template #${selectedTemplate.template_number}` : null,
      hasMultipleSizes ? selected.label : null,
    ]
      .filter(Boolean)
      .join(' — ');
    for (let index = 0; index < quantity; index += 1) {
      addToPortfolioCart({
        id: cartId,
        title: cartTitle,
        category: 'Memorial keepsake',
        image: selectedTemplate?.image_url ?? product.image_url ?? undefined,
        size: selected.label,
        serviceType: categoryToServiceLabel(product.category) ?? undefined,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div>
      {templates.length > 0 && (
        <div className="border-b border-border pb-6">
          <label htmlFor="template-select" className="font-mono text-[11px] uppercase tracking-widest text-cat-muted">
            Choose a template <span className="normal-case text-cat-muted/70">(optional)</span>
          </label>
          <select
            id="template-select"
            value={selectedTemplate?.id ?? ''}
            onChange={(e) => setSelectedTemplate(templates.find((t) => t.id === e.target.value) ?? null)}
            className="mt-3 w-full rounded-full border border-border bg-cat-surface px-4 py-2.5 font-body text-sm text-cat-heading outline-none focus:border-cat-accent"
          >
            <option value="">No template — I&apos;ll discuss this with the studio</option>
            {sortedTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                #{template.template_number} — {titleWithoutTemplateNumber(template)}
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <div className="mt-3 flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-cat-bg">
                <Image src={selectedTemplate.image_url} alt={selectedTemplate.title} fill sizes="56px" className="object-cover" />
              </div>
              <p className="font-body text-sm text-cat-body">
                Template <strong className="font-semibold">#{selectedTemplate.template_number}</strong> — {titleWithoutTemplateNumber(selectedTemplate)}
              </p>
            </div>
          )}
        </div>
      )}

      {hasMultipleSizes && (
        <div className={templates.length > 0 ? 'mt-6' : ''}>
          <p className="font-mono text-[11px] uppercase tracking-widest text-cat-muted">Choose a size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setSelected(size)}
                aria-pressed={selected.label === size.label}
                className={[
                  'rounded-full border px-4 py-2 font-body text-sm transition-all duration-200',
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

      <div
        className={
          hasMultipleSizes
            ? 'mt-6 border-t border-border pt-6'
            : templates.length > 0
              ? 'mt-6'
              : ''
        }
      >
        <p className="font-mono text-[11px] uppercase tracking-widest text-cat-muted">Size</p>
        <p className="mt-2 font-body text-cat-body">{selected.dimensions}</p>
        {selected.description && (
          <p className="mt-3 font-body text-sm leading-relaxed text-cat-body">{selected.description}</p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <span className="font-body text-cat-body">Quantity</span>
        <div className="flex items-center rounded-full border border-border">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-full text-cat-heading">−</button>
          <span className="w-10 text-center font-mono text-sm">{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-11 w-11 rounded-full text-cat-heading">+</button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addItem}
          className="flex-1 rounded-2xl border border-cat-accent bg-cat-accent px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-cat-bg hover:bg-cat-accent-dark"
        >
          {added ? 'Added ✓' : 'Add to cart'}
        </button>
        <Link
          href="/pricing"
          onClick={addItem}
          className="flex-1 rounded-2xl border border-cat-heading px-6 py-3 text-center font-mono text-[11px] uppercase tracking-widest text-cat-heading hover:bg-cat-heading hover:text-cat-bg"
        >
          Checkout
        </Link>
      </div>
      <p className="mt-3 font-mono text-[11px] text-cat-muted">No price shown here — every project is quoted individually once we&apos;ve reviewed your details.</p>
    </div>
  );
}
