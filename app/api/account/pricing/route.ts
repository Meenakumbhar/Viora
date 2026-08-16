import { NextRequest, NextResponse } from 'next/server';
import { getEffectivePrice } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, EffectivePrice } from '@/types/database';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/account/pricing?portfolioItemId=... — what the logged-in
// customer should see on the pricing page: their own negotiated price if
// one has been set, otherwise the price set for the exact piece in their
// cart (see getEffectivePrice in lib/db.ts). Always scoped to the session's
// own user id — a customer can never request another customer's price
// through this route, and `portfolioItemId` only ever picks which *public*
// piece price to show, never whose price to look up. `data: null` (still a
// 200) means neither exists yet, distinct from the 401 a guest gets for
// "not logged in at all".
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const portfolioItemIdParam = request.nextUrl.searchParams.get('portfolioItemId');
  const portfolioItemId = portfolioItemIdParam && UUID_RE.test(portfolioItemIdParam) ? portfolioItemIdParam : null;

  const price = await getEffectivePrice(session.user.id, portfolioItemId);

  return NextResponse.json<ApiResponse<EffectivePrice | null>>({ success: true, data: price });
}
