import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import SectionReveal from '@/components/ui/SectionReveal';
import ProductOrderPanel from '@/components/ProductOrderPanel';
import { products, getProductBySlug, getRelatedProducts } from '@/lib/data';
import { SITE_URL } from '@/lib/site-url';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found', description: 'This product page could not be found.' };
  }

  const title = product.title;
  const description = product.description;
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
      images: [{ url: product.image ?? '/og-image.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image ?? '/og-image.jpg'],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.relatedSlugs);

  return (
    <div data-category="funeral">
      <main className="bg-[#FDFCFA] pb-24 pt-28 text-[#1C2530]">
        <div className="container-wide">
          <Link href="/products" className="font-mono text-[11px] uppercase tracking-widest text-[#5B6470] hover:text-[#1C2530]">
            ← Back to products
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-cat-surface">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-8xl font-bold text-cat-heading opacity-[0.06]">
                    {product.title.charAt(0)}
                  </span>
                </div>
              )}
            </section>

            <section>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#6B5420]">Product</span>
              <h1 className="mt-4 font-display text-5xl leading-none text-[#1C2530] md:text-6xl">{product.title}</h1>
              <p className="mt-4 font-display text-xl italic text-accent-gold">{product.subtitle}</p>
              <p className="mt-6 font-body text-body-lg leading-relaxed text-[#374151]">{product.description}</p>

              <div className="mt-10 border-t border-border pt-8">
                <ProductOrderPanel product={product} />
              </div>
            </section>
          </div>

          {related.length > 0 && (
            <SectionReveal>
              <div className="mt-24 border-t border-border pt-16">
                <h2 className="font-display text-2xl text-cat-heading">You might also like</h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/products/${rel.slug}`}
                      className="group flex items-center gap-4 border border-border bg-cat-surface p-4 transition-colors duration-300 hover:border-cat-accent"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-cat-bg">
                        {rel.image ? (
                          <Image src={rel.image} alt={rel.title} fill sizes="64px" className="object-cover" />
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
