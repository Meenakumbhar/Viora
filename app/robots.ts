import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',        // Never index the admin dashboard
          '/admin/',
          '/api/',         // Never index API routes
          '/_next/',       // Next.js internals
        ],
      },
    ],
    sitemap: 'https://memoriesinprints.com/sitemap.xml',
    host: 'https://memoriesinprints.com',
  };
}
