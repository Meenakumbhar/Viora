import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertCustomerItemPrice, getUserById, getPortfolioItemById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, CustomerItemPrice } from '@/types/database';

// Admin only — gated in proxy.ts, same as the other pricing routes. Sets or
// updates the price for one specific piece, for one specific customer — the
// most specific layer in getEffectivePrice (lib/db.ts), above the piece's
// shared baseline.
const upsertSchema = z.object({
  userId: z.string().trim().min(1, 'A customer is required.'),
  portfolioItemId: z.string().trim().uuid('Invalid portfolio item id.'),
  price: z.number().positive('Price must be greater than zero.').max(1_000_000),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code, e.g. GBP.').toUpperCase().default('GBP'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, upsertSchema, 'admin/customer-item-pricing');
    if (parsed.error) return parsed.error;
    const { userId, portfolioItemId, price, currency } = parsed.data;

    const [customer, item] = await Promise.all([getUserById(userId), getPortfolioItemById(portfolioItemId)]);
    if (!customer) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Customer not found.' }, { status: 404 });
    }
    if (!item) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Portfolio item not found.' }, { status: 404 });
    }

    const entry = await upsertCustomerItemPrice(userId, portfolioItemId, price, currency);

    return NextResponse.json<ApiResponse<CustomerItemPrice>>({ success: true, data: entry });
  } catch (err) {
    console.error('[admin/customer-item-pricing] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
