import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertPortfolioItemPrice, getPortfolioItemById } from '@/lib/db';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, PortfolioItemPrice } from '@/types/database';

// Admin only — gated in proxy.ts, same as /api/admin/customer-item-pricing.
// Sets or updates the shared baseline price for one specific portfolio
// piece — see getEffectivePrice in lib/db.ts for where this sits in the
// overall lookup order (below a customer-item-specific override).
const upsertSchema = z.object({
  portfolioItemId: z.string().trim().uuid('Invalid portfolio item id.'),
  price: z.number().positive('Price must be greater than zero.').max(1_000_000),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code, e.g. GBP.').toUpperCase().default('GBP'),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, upsertSchema, 'admin/portfolio-item-pricing');
    if (parsed.error) return parsed.error;
    const { portfolioItemId, price, currency } = parsed.data;

    const item = await getPortfolioItemById(portfolioItemId);
    if (!item) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Portfolio item not found.' }, { status: 404 });
    }

    const entry = await upsertPortfolioItemPrice(portfolioItemId, price, currency);

    return NextResponse.json<ApiResponse<PortfolioItemPrice>>({ success: true, data: entry });
  } catch (err) {
    console.error('[admin/portfolio-item-pricing] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
