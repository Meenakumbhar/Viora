import type { NextConfig } from 'next';

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'edcgufmpjsurhqfoejta.supabase.co';

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

const CSP = [
  "default-src 'self'",
  // React dev mode needs eval() for its debugging/stack-trace features — never used in production builds.
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ''}https://*.paypal.com https://*.paypalobjects.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.paypal.com https://*.paypalobjects.com",
  "frame-src https://*.paypal.com",
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
      // Supabase Storage CDN
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
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
    // Cache optimised images for 60 days
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },
};

export default nextConfig;
