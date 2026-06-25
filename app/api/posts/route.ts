import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { ApiResponse, Post } from '@/types/database';

// GET /api/posts — Fetch published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    const supabase = await createClient();

    // Fetch a single post by slug
    if (slug) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Post not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<Post>>(
        { success: true, data },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
        }
      );
    }

    // Fetch list of posts
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, category, image_url, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[posts] Supabase select error:', error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch posts.' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Partial<Post>[]>>(
      { success: true, data: data ?? [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      }
    );
  } catch (err) {
    console.error('[posts] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
