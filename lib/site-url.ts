/**
 * The site's current live base URL — used for metadata, canonical links,
 * sitemap/robots, and links inside transactional emails.
 *
 * Reads NEXT_PUBLIC_SITE_URL so this can be switched in one place (and in
 * Vercel's project env vars for production) once the custom domain goes
 * live, without another code change.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://memoriesinprints.vercel.app';
