import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { ApiResponse, PortfolioItem, ServiceCategory } from '@/types/database';

// GET /api/portfolio — Fetch published portfolio items (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ServiceCategory | null;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('portfolio_items')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[portfolio] Supabase select error:', error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch portfolio items.' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<PortfolioItem[]>>(
      { success: true, data: data ?? [] },
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
      { success: false, error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
