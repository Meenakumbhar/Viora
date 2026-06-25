import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import CategoryWrapper from '@/components/ui/CategoryWrapper';
import { PageTransition } from '@/components/ui/PageTransition';
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
    'A full-service design and print studio for weddings, funerals, events, sports, and branding. Serving clients worldwide.',
  metadataBase: new URL('https://memoriesinprints.com'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Memories in Prints',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */

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
    >
      <body className="font-body bg-bg-primary text-text-body antialiased">
        <Nav />
        <CategoryWrapper>
          <PageTransition>{children}</PageTransition>
        </CategoryWrapper>
        <Footer />
      </body>
    </html>
  );
}
