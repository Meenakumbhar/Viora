'use client';

import { Fragment, useMemo, useState } from 'react';
import type { PublicUser, Product, ProductSize, CustomerProductPrice } from '@/types/database';
import { formatPrice } from '@/lib/format';
import { postJson } from '@/lib/api-client';

function CustomerProductSizePriceRow({
  userId,
  product,
  size,
  price,
  onSaved,
}: {
  userId: string;
  product: Product;
  size: ProductSize;
  price: CustomerProductPrice | undefined;
  onSaved: (price: CustomerProductPrice) => void;
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
      const saved = await postJson<CustomerProductPrice>('/api/admin/customer-product-pricing', {
        userId,
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

interface CustomerProductPricingManagerProps {
  initialUsers: PublicUser[];
  initialProducts: Product[];
  initialPrices: CustomerProductPrice[];
}

export default function CustomerProductPricingManager({
  initialUsers,
  initialProducts,
  initialPrices,
}: CustomerProductPricingManagerProps) {
  const [prices, setPrices] = useState<CustomerProductPrice[]>(initialPrices);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState('');
  const [pricedOnly, setPricedOnly] = useState(false);

  const selectedUser = useMemo(
    () => initialUsers.find((u) => u.id === selectedUserId) ?? null,
    [initialUsers, selectedUserId]
  );

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return initialUsers
      .filter((u) => u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [initialUsers, customerQuery]);

  const pricesByKey = useMemo(() => {
    const map = new Map<string, CustomerProductPrice>();
    if (!selectedUserId) return map;
    prices.forEach((p) => {
      if (p.user_id === selectedUserId) map.set(`${p.product_id}::${p.size_label}`, p);
    });
    return map;
  }, [prices, selectedUserId]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return initialProducts.filter((product) => {
      if (pricedOnly && !product.sizes.some((s) => pricesByKey.has(`${product.id}::${s.label}`))) return false;
      if (!q) return true;
      return product.title.toLowerCase().includes(q) || product.type_label.toLowerCase().includes(q);
    });
  }, [initialProducts, productQuery, pricedOnly, pricesByKey]);

  function handleSaved(price: CustomerProductPrice) {
    setPrices((prev) => {
      const next = prev.filter(
        (p) => !(p.user_id === price.user_id && p.product_id === price.product_id && p.size_label === price.size_label)
      );
      return [...next, price];
    });
  }

  return (
    <section className="dash-legacy">
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Customer × product pricing</p>
      <p className="mb-4 font-mono text-[11px] text-white/30">
        The same product size can cost a different amount for different customers. This is the most specific price
        there is — it wins over the product&apos;s shared baseline below.
      </p>

      {!selectedUser ? (
        <div className="relative w-80">
          <input
            type="text"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Search for a customer by name or email…"
            className="w-full border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
          />
          {filteredCustomers.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full border border-white/15 bg-[#0E1117]">
              {filteredCustomers.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => { setSelectedUserId(u.id); setCustomerQuery(''); }}
                    className="block w-full px-3 py-2 text-left font-body text-sm text-white/80 hover:bg-white/[0.05]"
                  >
                    {u.email} {u.name && <span className="text-white/40">· {u.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="font-body text-sm text-white/90">
              {selectedUser.email} {selectedUser.name && <span className="text-white/40">· {selectedUser.name}</span>}
            </p>
            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white"
            >
              Change customer
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4">
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Search by title or type…"
              className="w-80 border border-white/15 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-[#C6A85C]"
            />
            <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/40">
              <input
                type="checkbox"
                checked={pricedOnly}
                onChange={(e) => setPricedOnly(e.target.checked)}
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
                        <CustomerProductSizePriceRow
                          key={`${product.id}::${size.label}`}
                          userId={selectedUser.id}
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
        </>
      )}
    </section>
  );
}
