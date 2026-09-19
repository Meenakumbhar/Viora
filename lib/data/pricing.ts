// ─── Pricing ─────────────────────────────────────────────────────────
// Part of the lib/data boundary: this is the surface pages and route
// handlers import, instead of reaching into lib/db directly. Keeping the
// public surface domain-scoped (rather than one 2,000-line module) means
// the UI can be rewritten against a stable contract, and the queries behind
// it can later move out of lib/db without touching a single caller.
import 'server-only';

export {
  getPortfolioItemPrice,
  getAllPortfolioItemPrices,
  upsertPortfolioItemPrice,
  getCustomerItemPrice,
  getAllCustomerItemPrices,
  upsertCustomerItemPrice,
  getEffectivePrice,
  getProductPrice,
  getAllProductPrices,
  getProductPricesForProduct,
  upsertProductPrice,
  getCustomerProductPrice,
  getAllCustomerProductPrices,
  upsertCustomerProductPrice,
  getEffectiveProductPrice,
  syncOrderPricingFromCatalog,
} from '@/lib/db';

import {
  getAllPortfolioItemPrices as queryAllPortfolioItemPrices,
  getAllCustomerItemPrices as queryAllCustomerItemPrices,
  getAllProductPrices as queryAllProductPrices,
  getAllCustomerProductPrices as queryAllCustomerProductPrices,
  getRelatedProducts as queryProductsBySlug,
  setOrderPaymentAmount as writeOrderPaymentAmount,
} from '@/lib/db';
import type { EffectivePrice, Order } from '@/types/database';

/**
 * Batched equivalent of syncOrderPricingFromCatalog for a list of orders.
 *
 * The per-order version costs up to five round-trips each (account lookup,
 * product-by-slug, customer price, catalog price, then the write), so calling
 * it in a loop made a page's query count scale with the order count — and the
 * neon-http driver opens a fresh HTTP request per query, so that compounds.
 *
 * This resolves the same prices with a fixed number of reads: the four
 * pricing tables, plus one products-by-slug lookup. Writes still happen per
 * order, but only for orders whose price actually changed — which is
 * normally none, since the figure is already in sync.
 *
 * Reading the pricing tables whole is the deliberate trade: at this catalog's
 * size that is cheaper than per-order lookups by a wide margin. If those
 * tables ever grow large, narrow these to inArray reads keyed by the ids
 * collected below rather than going back to a query per order.
 */
export async function syncOrderPricingForOrders(
  orders: Order[],
  resolveUserId: (order: Order) => string | null
): Promise<Order[]> {
  if (orders.length === 0) return [];

  // Mirrors the per-order function's guard: paid orders are never repriced.
  const pending = orders.filter((o) => o.payment_status !== 'paid');
  if (pending.length === 0) return orders;

  // A price is only derived when the order references exactly one piece —
  // same rule as the per-order version.
  const singleItemId = (order: Order): string | null => {
    const items = order.portfolio_items;
    return items && items.length === 1 ? items[0].id : null;
  };

  // Product cart entries use a composite `slug::size[::templateNumber]` id
  // (see PortfolioCartItem) rather than a portfolio-item UUID.
  const slugs = Array.from(
    new Set(
      pending
        .map(singleItemId)
        .filter((id): id is string => Boolean(id?.includes('::')))
        .map((id) => id.split('::')[0])
    )
  );

  const needsProducts = slugs.length > 0;
  const needsPortfolio = pending.some((o) => {
    const id = singleItemId(o);
    return Boolean(id) && !id!.includes('::');
  });

  const [portfolioPrices, customerItemPrices, productPrices, customerProductPrices, products] =
    await Promise.all([
      needsPortfolio ? queryAllPortfolioItemPrices() : Promise.resolve([]),
      needsPortfolio ? queryAllCustomerItemPrices() : Promise.resolve([]),
      needsProducts ? queryAllProductPrices() : Promise.resolve([]),
      needsProducts ? queryAllCustomerProductPrices() : Promise.resolve([]),
      needsProducts ? queryProductsBySlug(slugs) : Promise.resolve([]),
    ]);

  const productIdBySlug = new Map(products.map((p) => [p.slug, p.id]));
  const portfolioPriceByItem = new Map(portfolioPrices.map((p) => [p.portfolio_item_id, p]));
  const customerItemPriceByKey = new Map(
    customerItemPrices.map((p) => [`${p.user_id}::${p.portfolio_item_id}`, p])
  );
  const productPriceByKey = new Map(productPrices.map((p) => [`${p.product_id}::${p.size_label}`, p]));
  const customerProductPriceByKey = new Map(
    customerProductPrices.map((p) => [`${p.user_id}::${p.product_id}::${p.size_label}`, p])
  );

  // Same precedence as getEffectivePrice / getEffectiveProductPrice: a
  // customer-specific price wins, otherwise the catalog price, otherwise
  // nothing (and the order is left untouched).
  const resolve = (order: Order): EffectivePrice | null => {
    const userId = resolveUserId(order);
    const itemId = singleItemId(order);
    if (!itemId) return null;

    if (itemId.includes('::')) {
      const [slug, sizeLabel] = itemId.split('::');
      const productId = productIdBySlug.get(slug);
      if (!productId || !sizeLabel) return null;

      if (userId) {
        const negotiated = customerProductPriceByKey.get(`${userId}::${productId}::${sizeLabel}`);
        if (negotiated) {
          return { price: negotiated.price, currency: negotiated.currency, negotiated: true };
        }
      }
      const catalog = productPriceByKey.get(`${productId}::${sizeLabel}`);
      return catalog ? { price: catalog.price, currency: catalog.currency, negotiated: false } : null;
    }

    if (userId) {
      const negotiated = customerItemPriceByKey.get(`${userId}::${itemId}`);
      if (negotiated) {
        return { price: negotiated.price, currency: negotiated.currency, negotiated: true };
      }
    }
    const catalog = portfolioPriceByItem.get(itemId);
    return catalog ? { price: catalog.price, currency: catalog.currency, negotiated: false } : null;
  };

  const changed = pending
    .map((order) => ({ order, effective: resolve(order) }))
    .filter((r) => r.effective !== null && r.order.payment_amount !== r.effective.price);

  if (changed.length === 0) return orders;

  const updates = await Promise.all(
    changed.map(async ({ order, effective }) => writeOrderPaymentAmount(order.id, effective!.price))
  );
  const updatedById = new Map<string, Order>();
  changed.forEach(({ order }, i) => {
    const updated = updates[i];
    if (updated) updatedById.set(order.id, updated);
  });

  return orders.map((order) => updatedById.get(order.id) ?? order);
}
