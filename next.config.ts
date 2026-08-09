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

const nextConfig: NextConfig = {
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
