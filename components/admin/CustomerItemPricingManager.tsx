'use client';

import { useMemo, useState } from 'react';
import type { PublicUser, PortfolioItem, CustomerItemPrice } from '@/types/database';
import { formatPrice } from '@/lib/format';
import { postJson } from '@/lib/api-client';

function CustomerItemPriceRow({
  userId,
  item,
  price,
  onSaved,
}: {
  userId: string;
  item: PortfolioItem;
  price: CustomerItemPrice | undefined;
  onSaved: (price: CustomerItemPrice) => void;
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
      const saved = await postJson<CustomerItemPrice>('/api/admin/customer-item-pricing', {
        userId,
        portfolioItemId: item.id,
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
      <td className="px-4 py-3 font-mono text-xs text-white/40">{item.template_number ?? '—'}</td>
      <td className="px-4 py-3 font-body text-sm text-white/90">{item.title}</td>
      <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-white/40">{item.category}</td>
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

interface CustomerItemPricingManagerProps {
  initialUsers: PublicUser[];
  initialItems: PortfolioItem[];
  initialPrices: CustomerItemPrice[];
}

export default function CustomerItemPricingManager({
  initialUsers,
  initialItems,
  initialPrices,
}: CustomerItemPricingManagerProps) {
  const [prices, setPrices] = useState<CustomerItemPrice[]>(initialPrices);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [itemQuery, setItemQuery] = useState('');
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

  const pricesByItemId = useMemo(() => {
    const map = new Map<string, CustomerItemPrice>();
    if (!selectedUserId) return map;
    prices.forEach((p) => {
      if (p.user_id === selectedUserId) map.set(p.portfolio_item_id, p);
    });
    return map;
  }, [prices, selectedUserId]);

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    return initialItems.filter((item) => {
      if (pricedOnly && !pricesByItemId.has(item.id)) return false;
      if (!q) return true;
      return item.title.toLowerCase().includes(q) || (item.template_number ?? '').toLowerCase().includes(q);
    });
  }, [initialItems, itemQuery, pricedOnly, pricesByItemId]);

  function handleSaved(price: CustomerItemPrice) {
    setPrices((prev) => {
      const next = prev.filter((p) => !(p.user_id === price.user_id && p.portfolio_item_id === price.portfolio_item_id));
      return [...next, price];
    });
  }

  return (
    <section className="dash-legacy">
      <p className="mb-1 font-mono text-xs uppercase tracking-[0.18em] text-white/60">Customer × item pricing</p>
      <p className="mb-4 font-mono text-[11px] text-white/30">
        The same piece can cost a different amount for different customers. This is the most specific price there
        is — it wins over the piece&apos;s shared baseline below.
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
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              placeholder="Search by title or template number…"
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
              Showing {filteredItems.length} of {initialItems.length}
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="border border-white/10 p-10 text-center font-mono text-xs text-white/30">
              No items match this search.
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto overflow-x-auto border border-white/10">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0E1117]">
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Template #</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Title</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Category</th>
                    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-white/40">Price</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <CustomerItemPriceRow
                      key={item.id}
                      userId={selectedUser.id}
                      item={item}
                      price={pricesByItemId.get(item.id)}
                      onSaved={handleSaved}
                    />
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
