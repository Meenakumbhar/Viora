'use client';

import { useState } from 'react';
import PortfolioHero from '@/components/ui/PortfolioHero';
import SectionReveal from '@/components/ui/SectionReveal';
import PortfolioGrid from '@/components/ui/PortfolioGrid';
import Button from '@/components/ui/Button';
import type { PortfolioItem } from '@/types/database';

interface PortfolioPageContentProps {
  initialItems: PortfolioItem[];
  initialCategory?: string;
}

export default function PortfolioPageContent({
  initialItems,
  initialCategory = 'all',
}: PortfolioPageContentProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  return (
    <div data-category={activeCategory}>
      {/* Hero Section — dynamically changes with category filter */}
      <PortfolioHero activeCategory={activeCategory} />

      {/* Grid Section — top padding trimmed down from the bottom's: the hero
          already ends in ~128px of its own bottom padding + gradient fade,
          so a full py-24/36 here on top of that read as a dead gap. No
          border-t here either — the "Refine this collection" block right
          below already carries its own top border, and with the padding
          this tight the two rules sat close enough to read as a doubled
          line with nothing between them. */}
      <section className="bg-cat-bg pt-12 pb-24 md:pt-16 md:pb-36 transition-colors duration-500">
        <div className="container-wide">
          <SectionReveal>
            <PortfolioGrid
              items={initialItems}
              onCategoryChange={setActiveCategory}
              initialCategory={activeCategory}
              showFilters={activeCategory === 'all'}
            />
          </SectionReveal>
        </div>
      </section>

      {/* CTA Section — swapped back to a light panel with the accent (now a
          pale champagne gold) carried on the button instead of the
          background, so the colour actually reads instead of being buried
          under white-on-dark text. */}
      <section className="bg-cat-surface border-t border-border py-24 md:py-36 text-center transition-colors duration-500">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-cat-heading">
              Have a project <em className="not-italic font-semibold text-accent-gold">in mind?</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
              We work closely with individuals, couples, brands, and organizers to create premium design and print assets.
            </p>
            <div className="mt-10">
              <Button
                variant="primary"
                size="lg"
                href="/contact"
                className="!text-cat-heading hover:!bg-cat-accent-dark hover:!text-white"
              >
                Start a Project
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
