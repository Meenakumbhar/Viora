import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioItems, createPortfolioItem } from '@/lib/db';
import type { ApiResponse, PortfolioItem } from '@/types/database';

const VALID_CATEGORIES = ['wedding', 'funeral', 'sports', 'branding', 'events'];

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

// POST /api/portfolio — Create a portfolio item (admin only, gated in middleware.ts)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, category, description, location, image_url, image_urls, filters, published } = body;

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Title is required.' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid category.' }, { status: 400 });
    }
    if (typeof image_url !== 'string' || !image_url.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'An image is required.' }, { status: 400 });
    }

    const item = await createPortfolioItem({
      title,
      category,
      filters: filters ?? {},
      image_url,
      image_urls: Array.isArray(image_urls) ? image_urls : null,
      description: typeof description === 'string' ? description : null,
      location: typeof location === 'string' ? location : null,
      published: published !== false,
    });

    return NextResponse.json<ApiResponse<PortfolioItem>>({ success: true, data: item }, { status: 201 });
  } catch (err) {
    console.error('[portfolio] Create error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create portfolio item.' },
      { status: 500 }
    );
  }
}
