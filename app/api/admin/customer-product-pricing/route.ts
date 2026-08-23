import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertCustomerProductPrice, getUserById, getProductById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, CustomerProductPrice } from '@/types/database';

// Admin only — gated in proxy.ts, same as the other pricing routes. Sets or
// updates the price for one (product, size) pair, for one specific
// customer — the most specific layer in getEffectiveProductPrice
// (lib/db.ts), above the product's shared baseline.
const upsertSchema = z.object({
  userId: z.string().trim().min(1, 'A customer is required.'),
  productId: z.string().trim().uuid('Invalid product id.'),
  sizeLabel: z.string().trim().min(1, 'A size is required.').max(100),
  price: z.number().positive('Price must be greater than zero.').max(1_000_000),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code, e.g. GBP.').toUpperCase().default('GBP'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, upsertSchema, 'admin/customer-product-pricing');
    if (parsed.error) return parsed.error;
    const { userId, productId, sizeLabel, price, currency } = parsed.data;

    const [customer, product] = await Promise.all([getUserById(userId), getProductById(productId)]);
    if (!customer) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Customer not found.' }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Product not found.' }, { status: 404 });
    }
    if (!product.sizes.some((s) => s.label === sizeLabel)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unknown size for this product.' }, { status: 404 });
    }

    const entry = await upsertCustomerProductPrice(userId, productId, sizeLabel, price, currency);

    return NextResponse.json<ApiResponse<CustomerProductPrice>>({ success: true, data: entry });
  } catch (err) {
    console.error('[admin/customer-product-pricing] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
