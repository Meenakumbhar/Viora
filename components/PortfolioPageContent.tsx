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

      {/* Grid Section */}
      <section className="bg-cat-bg py-24 md:py-36 border-t border-border transition-colors duration-500">
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

      {/* CTA Section */}
      <section className="bg-cat-surface border-t border-border py-24 md:py-36 text-center transition-colors duration-500">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-cat-heading">
              Have a project <em className="italic text-accent-gold">in mind?</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
              We work closely with individuals, couples, brands, and organizers to create premium design and print assets.
            </p>
            <div className="mt-10">
              <Button variant="primary" size="lg" href="/contact">
                Start a Project
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
