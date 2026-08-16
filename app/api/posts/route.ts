import { NextRequest, NextResponse } from 'next/server';
import { getBlogPosts, getBlogPostBySlug } from '@/lib/db';
import type { ApiResponse, Post } from '@/types/database';

// GET /api/posts — Fetch published blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const slug = searchParams.get('slug');

    // Fetch a single post by slug
    if (slug) {
      const post = await getBlogPostBySlug(slug);

      if (!post) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Post not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<Post>>(
        { success: true, data: post },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
        }
      );
    }

    // Fetch list of posts
    const posts = await getBlogPosts(limit);

    return NextResponse.json<ApiResponse<Partial<Post>[]>>(
      { success: true, data: posts },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      }
    );
  } catch (err) {
    console.error('[posts] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch posts.' },
      { status: 500 }
    );
  }
}
