import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import CategoryWrapper from '@/components/ui/CategoryWrapper';
import { PageTransition } from '@/components/ui/PageTransition';
import { unstable_cache } from 'next/cache';
import { SITE_URL } from '@/lib/site-url';
import { getProducts } from '@/lib/db';
import './globals.css';

// getProducts() already swallows DB errors and returns [] rather than
// throwing (see lib/db.ts), so caching it here is safe even if the DB is
// briefly unreachable — worst case is a stale/empty nav list for up to
// REVALIDATE_SECONDS, not a crash. Wrapping it lets every route go back to
// being statically served/ISR'd instead of hitting Neon on every request.
const REVALIDATE_SECONDS = 60;
const getCachedProducts = unstable_cache(() => getProducts(), ['nav-products'], {
  revalidate: REVALIDATE_SECONDS,
  tags: ['products'],
});

/* ═══════════════════════════════════════════════════════════════════════════
   FONTS
   ═══════════════════════════════════════════════════════════════════════════ */

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-dm-mono',
  display: 'swap',
});

/* ═══════════════════════════════════════════════════════════════════════════
   METADATA
   ═══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: {
    default: 'Memories in Prints | Global Design & Print Studio',
    template: '%s | Memories in Prints',
  },
  description:
    'A full-service design and print studio for weddings, funerals, events, sports, and branding. Premium stationery, programmes, and print — serving clients in 30+ countries.',
  metadataBase: new URL(SITE_URL),
  keywords: [
    'wedding stationery',
    'funeral order of service',
    'memorial print',
    'sports matchday programme',
    'graphic design studio',
    'custom print',
    'wedding invitations',
    'bespoke stationery',
    'global print studio',
  ],
  authors: [{ name: 'Memories in Prints', url: SITE_URL }],
  creator: 'Memories in Prints',
  publisher: 'Memories in Prints',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Memories in Prints',
    title: 'Memories in Prints | Global Design & Print Studio',
    description:
      'Premium wedding stationery, funeral programmes, sports print, and brand identity — crafted with precision and shipped worldwide.',
    url: SITE_URL,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Memories in Prints — Global Design & Print Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memories in Prints | Global Design & Print Studio',
    description:
      'Premium wedding stationery, funeral programmes, sports print, and brand identity — shipped worldwide.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};


/* ═══════════════════════════════════════════════════════════════════════════
   ROOT LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await getCachedProducts();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-body bg-bg-primary text-text-body antialiased" suppressHydrationWarning>
        {/* Suspense boundary required because Nav reads the ?category=
            query param (via useSearchParams) to highlight the active
            portfolio filter — without it, useSearchParams forces this whole
            layout out of static rendering. */}
        <Suspense fallback={null}>
          <Nav products={products} />
        </Suspense>
        <CategoryWrapper>
          <PageTransition>{children}</PageTransition>
        </CategoryWrapper>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
