/**
 * Supabase Storage URL helpers
 *
 * Usage:
 *   import { storageUrl, portfolioImageUrl, blogImageUrl } from '@/utils/storage'
 *
 *   // Portfolio item image
 *   <Image src={portfolioImageUrl('wedding/amara-james.jpg')} ... />
 *
 *   // Blog post image
 *   <Image src={blogImageUrl('paper-stock.jpg')} ... />
 *
 *   // Any file in any bucket
 *   <Image src={storageUrl('portfolio-images', 'sports/riverside-fc.jpg')} ... />
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export function storageUrl(bucket: string, path: string): string {
  if (!SUPABASE_URL) return `/images/${bucket}/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Portfolio image — stored in the `portfolio-images` bucket.
 * path examples: 'wedding/amara-james.jpg' | 'funeral/margaret-oos.jpg'
 */
export function portfolioImageUrl(path: string): string {
  return storageUrl('portfolio-images', path);
}

/**
 * Blog image — stored in the `blog-images` bucket.
 * path examples: 'paper-stock.jpg' | 'rush-orders.jpg'
 */
export function blogImageUrl(path: string): string {
  return storageUrl('blog-images', path);
}

/**
 * Returns true if an image_url is already an absolute URL (Supabase CDN or external).
 * Falls back to local `/images/` path for backwards compat with seeded data.
 */
export function resolveImageUrl(imageUrl: string, fallback = '/images/placeholder.jpg'): string {
  if (!imageUrl) return fallback;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
  // Local public path (seeded data uses /images/portfolio/wedding.jpg etc.)
  return imageUrl;
}
