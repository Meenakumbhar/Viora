import { NextRequest, NextResponse } from 'next/server';
import { updateProduct, deleteProduct } from '@/lib/db';
import { productInputSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Product } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/products/[id] — Update a product (admin only, gated in proxy.ts)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, productInputSchema, 'products/:id');
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

    const product = await updateProduct(id, {
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

    if (!product) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<Product>>({ success: true, data: product });
  } catch (err) {
    console.error('[products] Update error:', err);
    const isDuplicateSlug = err instanceof Error && /unique|duplicate/i.test(err.message);
    return NextResponse.json<ApiResponse>(
      { success: false, error: isDuplicateSlug ? 'That slug is already in use.' : 'Failed to update product.' },
      { status: isDuplicateSlug ? 409 : 500 }
    );
  }
}

// DELETE /api/products/[id] — Delete a product (admin only, gated in proxy.ts)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{ id: string }>>({ success: true, data: { id } });
  } catch (err) {
    console.error('[products] Delete error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to delete product.' },
      { status: 500 }
    );
  }
}
