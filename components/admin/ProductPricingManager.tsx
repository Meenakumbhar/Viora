'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Product, ProductSize, ProductPrice } from '@/types/database';
import { formatPrice } from '@/lib/format';
import { postJson } from '@/lib/api-client';

function ProductSizePriceRow({
  product,
  size,
  price,
  onSaved,
}: {
  product: Product;
  size: ProductSize;
  price: ProductPrice | undefined;
  onSaved: (price: ProductPrice) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(price ? String(price.price) : '');
  const [currency, setCurrency] = useState(price?.currency ?? 'GBP');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startEditing() {
    setAmount(price ? String(price.price) : '');
    setCurrency(price?.currency ?? 'GBP');
    setError('');
    setEditing(true);
  }

  async function handleSave() {
    const numericPrice = Number(amount);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Enter a price greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await postJson<ProductPrice>('/api/admin/product-pricing', {
        productId: product.id,
        sizeLabel: size.label,
        price: numericPrice,
        currency,
      });
      onSaved(saved);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this price.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-4 py-3 pl-8 font-body text-sm text-white/90">{size.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-white/40">{size.dimensions}</td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="w-14 border border-white/15 bg-transparent px-2 py-1.5 font-mono text-xs uppercase text-white outline-none focus:border-[#C6A85C]"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-28 border border-white/15 bg-transparent px-2 py-1.5 text-sm text-white outline-none focus:border-[#C6A85C]"
            />
          </div>
        ) : (
          <span className="font-body text-sm text-white/70">
            {price ? formatPrice(price.price, price.currency) : <span className="text-white/30">Not set</span>}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-3">
            {error && <span className="font-mono text-[10px] text-red-400">{error}</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="font-mono text-[10px] uppercase tracking-widest text-[#C6A85C] hover:text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="font-mono text-[10px] uppercase tracking-widest text-[#C6A85C] hover:text-white"
          >
            {price ? 'Edit' : 'Set price'}
          </button>
        )}
      </td>
    </tr>
  );
}

interface ProductPricingManagerProps {
  initialProducts: Product[];
  initialPrices: ProductPrice[];
}

export default function ProductPricingManager({ initialProducts, initialPrices }: ProductPricingManagerProps) {
  const [prices, setPrices] = useState<ProductPrice[]>(initialPrices);
  const [query, setQuery] = useState('');
  const [showPricedOnly, setShowPricedOnly] = useState(false);

  const pricesByKey = useMemo(() => {
    const map = new Map<string, ProductPrice>();
    prices.forEach((p) => map.set(`${p.product_id}::${p.size_label}`, p));
    return map;
  }, [prices]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (showPricedOnly && !product.sizes.some((s) => pricesByKey.has(`${product.id}::${s.label}`))) return false;
      if (!q) return true;
      return product.title.toLowerCase().includes(q) || product.type_label.toLowerCase().includes(q);
    });
  }, [initialProducts, query, showPricedOnly, pricesByKey]);

  function handleSaved(price: ProductPrice) {
    setPrices((prev) => {
      const next = prev.filter((p) => !(p.product_id === price.product_id && p.size_label === price.size_label));
      return [...next, price];
    });
  }

  return (
    <section className="dash-legacy">
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Product pricing</p>
      <p className="mb-4 font-mono text-[11px] text-white/30">
        The price shown to any customer without their own negotiated price, per product size. Leave unset and
        they&apos;ll see a &quot;pricing is being prepared&quot; message instead.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or type…"
          className="w-80 border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
        />
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40">
          <input
            type="checkbox"
            checked={showPricedOnly}
            onChange={(e) => setShowPricedOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#C6A85C]"
          />
          Priced only
        </label>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
          Showing {filteredProducts.length} of {initialProducts.length}
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="border border-white/10 p-10 text-center font-mono text-xs text-white/30">
          No products match this search.
        </div>
      ) : (
        <div className="max-h-[32rem] overflow-y-auto overflow-x-auto border border-white/10">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#0E1117]">
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Size</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Dimensions</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <Fragment key={product.id}>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <td colSpan={4} className="px-4 py-2">
                      <span className="font-body text-sm text-white/90">{product.title}</span>{' '}
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                        {product.type_label} · {product.category}
                      </span>
                    </td>
                  </tr>
                  {product.sizes.map((size) => (
                    <ProductSizePriceRow
                      key={`${product.id}::${size.label}`}
                      product={product}
                      size={size}
                      price={pricesByKey.get(`${product.id}::${size.label}`)}
                      onSaved={handleSaved}
                    />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
