/**
 * Storage URL helpers — Supporting Cloudflare R2 and Supabase Storage
 *
 * Cloudflare R2 is the primary high-performance, zero-egress file storage.
 * Supabase Storage / local assets are maintained for backwards compatibility.
 */

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Build a public URL for a file stored in R2 or Supabase
 */
export function storageUrl(bucketOrFolder: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // 1. If R2 public URL is configured, prioritize Cloudflare R2
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    return `${base}/${bucketOrFolder}/${cleanPath}`;
  }

  // 2. Fallback to Supabase Storage if configured
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucketOrFolder}/${cleanPath}`;
  }

  // 3. Fallback to local public static directory
  return `/images/${bucketOrFolder}/${cleanPath}`;
}

/**
 * Portfolio image helper
 * path examples: 'wedding/amara-james.jpg' | 'funeral/margaret-oos.jpg'
 */
export function portfolioImageUrl(path: string): string {
  return storageUrl('portfolio', path);
}

/**
 * Blog image helper
 * path examples: 'paper-stock.jpg' | 'rush-orders.jpg'
 */
export function blogImageUrl(path: string): string {
  return storageUrl('blog', path);
}

/**
 * Resolves any image URL for rendering in <img> or Next.js <Image>:
 * - Direct HTTPS URLs (R2 CDN, Supabase Storage, Cloudinary, Unsplash)
 * - Local static paths (/images/...)
 * - Fallbacks
 */
export function resolveImageUrl(imageUrl?: string | null, fallback = '/images/placeholder.jpg'): string {
  if (!imageUrl || imageUrl.trim() === '') return fallback;
  const trimmed = imageUrl.trim();

  // If already an absolute URL (R2 pub-xxx.r2.dev, CDN, etc.)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // If it's a relative path starting with /
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // If it's a relative path without leading slash
  return `/${trimmed}`;
}
