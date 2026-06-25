import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { portfolioItems as staticPortfolio, blogPosts as staticBlog } from './data';
import type { PortfolioItem, Post } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// ─── Server-side Supabase client ─────────────────────────────────────────────
function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolioItems(category?: string): Promise<PortfolioItem[]> {
  const supabase = getClient();

  if (supabase) {
    try {
      let query = supabase
        .from('portfolio_items')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as PortfolioItem[];
    } catch (err) {
      console.error('[lib/supabase] getPortfolioItems error:', err);
    }
  }

  // Fallback to static data
  return staticPortfolio.map((item) => ({
    ...item,
    image_url: `/images/portfolio/${item.category}.jpg`,
    published: true,
    created_at: new Date().toISOString(),
  })) as PortfolioItem[];
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(limit = 20): Promise<Post[]> {
  const supabase = getClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) return data as Post[];
    } catch (err) {
      console.error('[lib/supabase] getBlogPosts error:', err);
    }
  }

  // Fallback to static data
  return staticBlog.map((post) => ({
    ...post,
    content: '',
    published: true,
    created_at: new Date().toISOString(),
  })) as Post[];
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  const supabase = getClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (!error && data) return data as Post;
    } catch (err) {
      console.error(`[lib/supabase] getBlogPostBySlug(${slug}) error:`, err);
    }
  }

  const staticPost = staticBlog.find((p) => p.slug === slug);
  return staticPost
    ? ({ ...staticPost, content: '', published: true, created_at: new Date().toISOString() } as Post)
    : null;
}
