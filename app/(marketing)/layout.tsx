import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import Nav from '@/components/ui/Nav';
import Footer from '@/components/ui/Footer';
import CategoryWrapper from '@/components/ui/CategoryWrapper';
import { PageTransition } from '@/components/ui/PageTransition';
import { getProducts } from '@/lib/data/products';

// getProducts() already swallows DB errors and returns [] rather than
// throwing (see lib/db.ts), so caching it here is safe even if the DB is
// briefly unreachable — worst case is a stale/empty nav list for up to
// REVALIDATE_SECONDS, not a crash. Wrapping it lets every route go back to
// being statically served/ISR'd instead of hitting Neon on every request.
//
// This sits in the marketing group rather than the root layout so the query
// only runs for routes whose Nav actually renders it — dashboard requests
// used to pay for a product list they never displayed.
const REVALIDATE_SECONDS = 60;
const getCachedProducts = unstable_cache(() => getProducts(), ['nav-products'], {
  revalidate: REVALIDATE_SECONDS,
  tags: ['products'],
});

/* ═══════════════════════════════════════════════════════════════════════════
   MARKETING LAYOUT — public site chrome
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await getCachedProducts();

  return (
    <>
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
    </>
  );
}
