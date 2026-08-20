import type { Product } from '@/types/database';

// Plain, client-safe helper (no DB import) — groups a flat product list
// into one entry per catalog type (type_slug), preserving the order types
// first appear in. Used anywhere that needs "one tile per type" rather
// than one per individual design: the /products listing page, the Nav
// dropdown, etc.
export interface ProductTypeGroup {
  type_slug: string;
  type_label: string;
  products: Product[];
}

export function groupProductsByType(products: Product[]): ProductTypeGroup[] {
  const groups = new Map<string, ProductTypeGroup>();

  for (const product of products) {
    const existing = groups.get(product.type_slug);
    if (existing) {
      existing.products.push(product);
    } else {
      groups.set(product.type_slug, {
        type_slug: product.type_slug,
        type_label: product.type_label,
        products: [product],
      });
    }
  }

  return Array.from(groups.values());
}
