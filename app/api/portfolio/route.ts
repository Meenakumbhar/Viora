import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioItems } from '@/lib/db';
import type { ApiResponse, PortfolioItem } from '@/types/database';

// GET /api/portfolio — Fetch published portfolio items (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const data = await getPortfolioItems(category);

    return NextResponse.json<ApiResponse<PortfolioItem[]>>(
      { success: true, data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    console.error('[portfolio] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch portfolio items.' },
      { status: 500 }
    );
  }
}
