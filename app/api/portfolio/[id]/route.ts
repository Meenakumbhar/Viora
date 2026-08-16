import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioItemById, updatePortfolioItem, deletePortfolioItem } from '@/lib/db';
import { portfolioItemInputSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, PortfolioItem } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/portfolio/[id] — Fetch a single published portfolio item
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const item = await getPortfolioItemById(id);

  if (!item) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Portfolio item not found.' }, { status: 404 });
  }

  return NextResponse.json<ApiResponse<PortfolioItem>>({ success: true, data: item });
}

// PUT /api/portfolio/[id] — Update a portfolio item (admin only, gated in middleware.ts)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, portfolioItemInputSchema, 'portfolio/:id');
    if (parsed.error) return parsed.error;
    const { title, category, description, location, image_url, image_urls, filters, template_number, published } = parsed.data;

    const item = await updatePortfolioItem(id, {
      title,
      category,
      filters: filters ?? {},
      template_number: template_number ?? null,
      image_url,
      image_urls: image_urls ?? null,
      description: description ?? null,
      location: location ?? null,
      published: published !== false,
    });

    if (!item) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Portfolio item not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<PortfolioItem>>({ success: true, data: item });
  } catch (err) {
    console.error('[portfolio] Update error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update portfolio item.' },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio/[id] — Delete a portfolio item (admin only, gated in middleware.ts)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deletePortfolioItem(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Portfolio item not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id } });
  } catch (err) {
    console.error('[portfolio] Delete error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete portfolio item.' },
      { status: 500 }
    );
  }
}
