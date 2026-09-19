import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import SWRProvider from '@/components/providers/SWRProvider';
import { SITE_URL } from '@/lib/site-url';
import './globals.css';

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

// Deliberately just the document shell — <html>/<body>, fonts and analytics.
// Page chrome lives in the route groups: app/(marketing) owns the Nav and
// Footer, app/(app) owns the dashboard shell. Keeping this layout free of
// both means a dashboard request no longer renders (or queries for) a
// marketing nav it never shows.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-body bg-bg-primary text-text-body antialiased" suppressHydrationWarning>
        <SWRProvider>{children}</SWRProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
