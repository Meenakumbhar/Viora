import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { products } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Memorial keepsakes and stationery — memory cards, thank you cards, memorial boards, seed cards, attendance cards, photo prints, bookmarks, and memorial portraits.',
};

export default function ProductsPage() {
  return (
    <div data-category="funeral">
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-cat-muted">
          What We Offer
        </span>
        <h1 className="mt-4 font-display text-display-xl text-cat-heading max-w-4xl">
          Our <em className="italic text-accent-gold">products</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-cat-body max-w-2xl leading-relaxed">
          A collection of memorial keepsakes and stationery, each designed to be thoughtfully personalised and produced with care.
        </p>
      </HeroVideo>

      <section className="bg-cat-bg py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  className="group flex flex-col overflow-hidden border border-border bg-cat-surface transition-colors duration-300 hover:border-cat-accent"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-cat-bg">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-6xl font-bold text-cat-heading opacity-[0.08]">
                          {product.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
                      {product.title}
                    </h2>
                    <p className="mt-2 font-body text-sm text-cat-body leading-relaxed line-clamp-3">
                      {product.subtitle}
                    </p>
                    <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-cat-muted">
                      {product.sizes.length > 1
                        ? `${product.sizes.length} sizes available`
                        : product.sizes[0]?.dimensions}
                    </p>
                    <span className="mt-auto pt-6 font-mono text-[10px] uppercase tracking-wider text-cat-accent-dark">
                      View details &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-cat-surface border-t border-border py-24 md:py-36 text-center">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-cat-heading">
              Don&apos;t see what you&apos;re <em className="italic text-accent-gold">looking for?</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
              We create bespoke memorial stationery too — share your ideas and we&apos;ll bring them to life.
            </p>
            <div className="mt-10">
              <Button variant="primary" size="lg" href="/contact">
                Request a Quote
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
