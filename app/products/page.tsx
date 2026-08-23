import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { getProducts } from '@/lib/db';
import { groupProductsByType } from '@/lib/product-types';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Memorial keepsakes and stationery — memory cards, thank you cards, memorial boards, seed cards, attendance cards, photo prints, bookmarks, and memorial portraits.',
};

export default async function ProductsPage() {
  const products = await getProducts();
  const groups = groupProductsByType(products);

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

      <section className="bg-cat-bg py-16 md:py-24 lg:py-28 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const representative = group.products[0];
                return (
                  <Link
                    key={group.type_slug}
                    href={`/products/${group.type_slug}`}
                    data-category={representative.category}
                    className="group flex flex-col overflow-hidden border border-border bg-cat-surface transition-colors duration-300 hover:border-cat-accent"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border bg-cat-bg">
                      {representative.image_url ? (
                        <Image
                          src={representative.image_url}
                          alt={group.type_label}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-display text-6xl font-bold text-cat-heading opacity-[0.08]">
                            {group.type_label.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h2 className="font-display text-xl text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
                        {group.type_label}
                      </h2>
                      <p className="mt-2 font-body text-sm text-cat-body leading-relaxed line-clamp-3">
                        {representative.subtitle}
                      </p>
                      <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-cat-muted">
                        {group.products.length > 1
                          ? `${group.products.length} designs available`
                          : representative.sizes.length > 1
                            ? `${representative.sizes.length} sizes available`
                            : representative.sizes[0]?.dimensions}
                      </p>
                      <span className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-wider text-cat-accent-dark">
                        View details &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="bg-cat-surface border-t border-border py-16 md:py-20 text-center">
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
