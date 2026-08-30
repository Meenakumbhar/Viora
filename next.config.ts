import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const r2Hostname = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL
  ? (() => {
      try {
        const url = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL;
        return url ? new URL(url).hostname : null;
      } catch {
        return null;
      }
    })()
  : null;

const isDev = process.env.NODE_ENV !== 'production';

// The private R2 storage endpoint the browser PUTs files to directly via a
// presigned URL (see utils/presigned-upload.ts) — distinct from R2_PUBLIC_URL
// above, which is the public CDN domain files are read back from afterward.
// R2 addresses the bucket as a subdomain of the account
// (<bucket>.<account-id>.r2.cloudflarestorage.com), hence the wildcard.
const r2StorageEndpoint = process.env.R2_ACCOUNT_ID
  ? `https://*.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : null;

const CSP = [
  "default-src 'self'",
  // React dev mode needs eval() for its debugging/stack-trace features — never used in production builds.
  // va.vercel-scripts.com is Vercel Analytics — served same-origin (/_vercel/insights/script.js)
  // once deployed on Vercel, but its dev-mode debug script loads directly from there.
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ''}https://*.paypal.com https://*.paypalobjects.com https://*.razorpay.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Hero background videos are hosted on Cloudflare R2 — without this,
  // media falls back to default-src 'self' and silently blocks any
  // cross-origin video/audio (R2, or anywhere else).
  `media-src 'self' https://*.r2.dev${r2Hostname && !r2Hostname.endsWith('.r2.dev') ? ` https://${r2Hostname}` : ''}`,
  // *.sentry.io covers Sentry's ingest endpoints across regions/orgs — narrow
  // this to the exact ingest host once a real DSN confirms it. The R2
  // storage endpoint is needed for direct browser-to-R2 uploads (presigned
  // PUT) — without it the CSP blocks the connection before it even reaches
  // R2's own CORS check, which looks identical to a network failure client-side.
  `connect-src 'self' https://*.paypal.com https://*.paypalobjects.com https://*.razorpay.com https://*.sentry.io https://va.vercel-scripts.com https://vitals.vercel-insights.com${r2StorageEndpoint ? ` ${r2StorageEndpoint}` : ''}`,
  "frame-src https://*.paypal.com https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public domains (e.g. pub-xxxx.r2.dev)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      // Cloudflare R2 specific configured public domain
      ...(r2Hostname
        ? [
            {
              protocol: 'https' as const,
              hostname: r2Hostname,
              pathname: '/**',
            },
          ]
        : []),
      // Cloudinary (future-proof)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Unsplash (for any placeholder images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Serve modern formats (WebP, AVIF) automatically
    formats: ['image/avif', 'image/webp'],
    // Allowed quality values (satisfies Next.js 16 requirement)
    qualities: [75, 80, 90],
    // In dev, expire immediately so replaced images show straight away;
    // in production, cache for 7 days.
    minimumCacheTTL: process.env.NODE_ENV === 'development' ? 1 : 60 * 60 * 24 * 7,
  },
};

// Wrapping is safe even without Sentry configured — `withSentryConfig` only
// uploads source maps (and needs SENTRY_AUTH_TOKEN) during a production
// build; without it, this just adds Sentry's request-tracing plumbing.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  // No auth token in most environments yet — skip the upload step entirely
  // rather than let it fail/warn on every build.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
