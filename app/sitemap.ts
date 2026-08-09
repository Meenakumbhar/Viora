import { MetadataRoute } from 'next';
import { getBlogPosts, getPortfolioItems } from '@/lib/db';
import { services } from '@/lib/data';

const BASE_URL = 'https://memoriesinprints.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/process`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // ── Service pages ──────────────────────────────────────────────────────────
  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${BASE_URL}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  // ── Blog post pages (fetched from Supabase) ────────────────────────────────
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await getBlogPosts(100);
    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.published_at ?? post.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch {
    // Silently skip — sitemap still works without blog routes
  }

  // ── Portfolio category filters ─────────────────────────────────────────────
  const categories = ['wedding', 'funeral', 'sports', 'branding', 'events'];
  const portfolioRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/portfolio?category=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...serviceRoutes, ...blogRoutes, ...portfolioRoutes];
}
