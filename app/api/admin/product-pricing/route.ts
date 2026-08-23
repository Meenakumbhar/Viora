import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertProductPrice, getProductById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, ProductPrice } from '@/types/database';

// Admin only — gated in proxy.ts, same as /api/admin/customer-product-pricing.
// Sets or updates the shared baseline price for one (product, size) pair —
// see getEffectiveProductPrice in lib/db.ts for where this sits in the
// overall lookup order (below a customer-specific override).
const upsertSchema = z.object({
  productId: z.string().trim().uuid('Invalid product id.'),
  sizeLabel: z.string().trim().min(1, 'A size is required.').max(100),
  price: z.number().positive('Price must be greater than zero.').max(1_000_000),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code, e.g. GBP.').toUpperCase().default('GBP'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, upsertSchema, 'admin/product-pricing');
    if (parsed.error) return parsed.error;
    const { productId, sizeLabel, price, currency } = parsed.data;

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    // sizeLabel is free text (a product's sizes are a jsonb array with no id
    // of their own), so unlike a portfolio item id there's no DB-level FK
    // integrity check — validate it against the product's actual sizes here
    // instead, or a typo would silently create an orphaned price row.
    if (!product.sizes.some((s) => s.label === sizeLabel)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unknown size for this product.' }, { status: 404 });
    }

    const entry = await upsertProductPrice(productId, sizeLabel, price, currency);

    return NextResponse.json<ApiResponse<ProductPrice>>({ success: true, data: entry });
  } catch (err) {
    console.error('[admin/product-pricing] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
