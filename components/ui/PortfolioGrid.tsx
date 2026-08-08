'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

interface PortfolioItemData {
  id: string;
  title: string;
  category: 'wedding' | 'funeral' | 'sports' | 'branding' | 'events';
  description?: string | null;
  location?: string | null;
}

interface PortfolioGridProps {
  items: PortfolioItemData[];
  showFilters?: boolean;
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

const ITEMS_PER_PAGE = 12;

const FILTERS = ['All', 'Wedding', 'Funeral', 'Events', 'Sports', 'Branding'] as const;

const categoryGradients: Record<string, string> = {
  wedding:
    'linear-gradient(145deg, #F5E6DF 0%, #E8D5C4 50%, #C4958F 100%)',
  funeral:
    'linear-gradient(145deg, #EDEAF8 0%, #D6D3EE 50%, #8B82C4 100%)',
  sports:
    'linear-gradient(145deg, #E2F0DB 0%, #C2DCBB 50%, #3D7A3A 100%)',
  branding:
    'linear-gradient(145deg, #E0E8F8 0%, #C2D4EE 50%, #2D5FA8 100%)',
  events:
    'linear-gradient(145deg, #F8EDDA 0%, #F5DFB8 50%, #D4883A 100%)',
};

const aspectVariants = ['aspect-[3/4]', 'aspect-[4/3]', 'aspect-square'] as const;

export default function PortfolioGrid({
  items,
  showFilters = true,
  onCategoryChange,
  initialCategory = 'all',
}: PortfolioGridProps) {
  const initialFilter = useMemo(() => {
    const matched = FILTERS.find(
      (f) => f.toLowerCase() === initialCategory.toLowerCase()
    );
    return matched || 'All';
  }, [initialCategory]);

  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [appearing, setAppearing] = useState<Set<string>>(() => {
    const matched = FILTERS.find(
      (f) => f.toLowerCase() === initialCategory.toLowerCase()
    );
    const filter = matched || 'All';
    const initialFiltered = filter === 'All'
      ? items
      : items.filter((item) => item.category.toLowerCase() === filter.toLowerCase());
    return new Set(initialFiltered.slice(0, ITEMS_PER_PAGE).map((item) => item.id));
  });
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return items;
    return items.filter(
      (item) => item.category.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [items, activeFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Clean up appearing animation class after delay
  useEffect(() => {
    if (appearing.size === 0) return;
    const timer = setTimeout(() => {
      setAppearing(new Set());
    }, 600);
    return () => clearTimeout(timer);
  }, [appearing]);

  function handleFilterChange(filter: string) {
    setActiveFilter(filter);
    setVisibleCount(ITEMS_PER_PAGE);

    const nextFiltered = filter === 'All'
      ? items
      : items.filter((item) => item.category.toLowerCase() === filter.toLowerCase());
    const nextVisible = nextFiltered.slice(0, ITEMS_PER_PAGE);
    setAppearing(new Set(nextVisible.map((item) => item.id)));
    
    const categoryKey = filter === 'All' ? 'all' : filter.toLowerCase();

    // Update URL query parameters without triggering full page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (categoryKey === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', categoryKey);
      }
      window.history.pushState({}, '', url.pathname + url.search);
    }

    // Notify parent about category change
    if (onCategoryChange) {
      onCategoryChange(categoryKey);
    }
  }

  function handleLoadMore() {
    const prevCount = visibleCount;
    setVisibleCount((c) => c + ITEMS_PER_PAGE);

    // Mark new items as appearing
    const newItems = filtered.slice(prevCount, prevCount + ITEMS_PER_PAGE);
    setAppearing(new Set(newItems.map((item) => item.id)));
  }

  return (
    <div data-category={activeFilter === 'All' ? 'all' : activeFilter.toLowerCase()}>
      {/* Filter bar */}
      {showFilters && (
        <div className="mb-12 flex flex-wrap gap-6" role="tablist" aria-label="Portfolio filters">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              role="tab"
              aria-selected={activeFilter === filter}
              onClick={() => handleFilterChange(filter)}
              className={[
                'pb-2 font-body text-body-base uppercase tracking-wider transition-all duration-300 cursor-pointer',
                activeFilter === filter
                  ? 'border-b-2 border-cat-accent text-cat-accent font-medium'
                  : 'border-b-2 border-transparent text-cat-muted hover:text-cat-heading',
              ].join(' ')}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* Masonry grid */}
      <div
        ref={gridRef}
        className="columns-1 gap-4 md:columns-2 lg:columns-3"
      >
        {visible.map((item, i) => {
          const aspect = aspectVariants[i % aspectVariants.length];
          const gradient = categoryGradients[item.category] || categoryGradients.branding;
          const isAppearing = appearing.has(item.id);

          return (
            <div
              key={item.id}
              data-category={item.category}
              className={[
                'group relative mb-4 break-inside-avoid overflow-hidden border border-border bg-cat-surface p-6',
                'transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cat-accent',
                isAppearing ? 'animate-slide-up' : '',
              ].join(' ')}
              style={
                isAppearing
                  ? { animationDelay: `${(i % ITEMS_PER_PAGE) * 80}ms` }
                  : undefined
              }
            >
              {/* Visual Header - Gradient block */}
              <div
                className={`${aspect} w-full border border-border/20 mb-6`}
                style={{ background: gradient }}
              />

              {/* Text Details Area */}
              <div>
                <span className="font-mono text-label uppercase text-cat-accent-dark block">
                  {item.category}
                </span>
                <h3 className="mt-2 font-display text-2xl text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-3 font-body text-body-base text-cat-body line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}
                
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-cat-muted uppercase tracking-wider">
                    {item.location || 'Worldwide'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-wider text-cat-accent-dark">
                    View Project <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <p className="py-16 text-center font-body text-body-lg text-text-muted">
          No projects found in this category.
        </p>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="border border-accent-gold bg-transparent px-8 py-3 font-body text-label uppercase tracking-wider text-accent-gold transition-all duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
