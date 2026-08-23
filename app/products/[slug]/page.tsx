import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SectionReveal from '@/components/ui/SectionReveal';
import ProductGallery from '@/components/ProductGallery';
import ProductOrderPanel from '@/components/ProductOrderPanel';
import { getProducts, getProductBySlug, getRelatedProducts, getPortfolioItems, getProductPricesForProduct } from '@/lib/db';
import { SITE_URL } from '@/lib/site-url';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found', description: 'This product page could not be found.' };
  }

  const title = product.title;
  const description = product.description ?? '';
  const url = `${SITE_URL}/products/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'Memories in Prints',
      locale: 'en_GB',
      images: [{ url: product.image_url ?? '/og-image.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image_url ?? '/og-image.jpg'],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [related, categoryPortfolioItems, productPrices] = await Promise.all([
    getRelatedProducts(product.related_slugs),
    getPortfolioItems(product.category),
    getProductPricesForProduct(product.id),
  ]);

  // Only portfolio pieces tagged with a template number are pickable here —
  // that number is what ties a product order back to a specific design.
  const templates = categoryPortfolioItems.filter((item) => item.template_number);

  return (
    <div data-category={product.category}>
      <main className="bg-[#FDFCFA] pb-24 pt-28 text-[#1C2530]">
        <div className="container-wide">
          <Link href="/products" className="font-mono text-[11px] uppercase tracking-widest text-[#5B6470] hover:text-[#1C2530]">
            ← Back to products
          </Link>

          <div className="mt-10 border border-border bg-bg-primary/60 p-4 sm:p-6 md:p-8">
            <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-start">
              <ProductGallery
                images={product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : []}
                title={product.title}
              />

              <section>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#6B5420]">Product</span>
                <h1 className="mt-3 font-display text-4xl leading-[1.05] text-[#1C2530] md:text-5xl">{product.title}</h1>
                {product.subtitle && (
                  <p className="mt-3 font-display text-lg italic text-accent-gold">{product.subtitle}</p>
                )}
                <p className="mt-5 max-w-md font-body text-body-base leading-relaxed text-[#374151]">
                  {product.description}
                </p>

                <div className="mt-8 border-t border-border pt-6">
                  <ProductOrderPanel product={product} templates={templates} basePrices={productPrices} />
                </div>
              </section>
            </div>
          </div>

          {related.length > 0 && (
            <SectionReveal>
              <div className="mt-24 border-t border-border pt-16">
                <h2 className="font-display text-2xl text-cat-heading">You might also like</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/products/${rel.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-cat-surface p-4 transition-colors duration-300 hover:border-cat-accent"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-cat-bg">
                        {rel.image_url ? (
                          <Image src={rel.image_url} alt={rel.title} fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="font-display text-xl font-bold text-cat-heading opacity-[0.1]">
                              {rel.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-display text-base text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
                        {rel.title}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </SectionReveal>
          )}
        </div>
      </main>
    </div>
  );
}
