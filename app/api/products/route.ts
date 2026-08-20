import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db';
import { productInputSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Product } from '@/types/database';

// GET /api/products — Fetch published products (optionally filtered by category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const data = await getProducts(category);

    return NextResponse.json<ApiResponse<Product[]>>(
      { success: true, data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    console.error('[products] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch products.' },
      { status: 500 }
    );
  }
}

// POST /api/products — Create a product (admin only, gated in proxy.ts)
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, productInputSchema, 'products');
    if (parsed.error) return parsed.error;
    const {
      slug,
      type_slug,
      type_label,
      title,
      subtitle,
      description,
      category,
      image_url,
      image_urls,
      sizes,
      related_slugs,
      published,
    } = parsed.data;

    const product = await createProduct({
      slug,
      type_slug,
      type_label,
      title,
      subtitle: subtitle ?? null,
      description: description ?? null,
      category,
      image_url: image_url ?? null,
      image_urls: image_urls ?? null,
      sizes,
      related_slugs: related_slugs ?? [],
      published: published !== false,
    });

    return NextResponse.json<ApiResponse<Product>>({ success: true, data: product }, { status: 201 });
  } catch (err) {
    console.error('[products] Create error:', err);
    const isDuplicateSlug = err instanceof Error && /unique|duplicate/i.test(err.message);
    return NextResponse.json<ApiResponse>(
      { success: false, error: isDuplicateSlug ? 'That slug is already in use.' : 'Failed to create product.' },
      { status: isDuplicateSlug ? 409 : 500 }
    );
  }
}
