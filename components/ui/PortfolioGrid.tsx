'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { PortfolioFilters } from '@/types/database';
import {
  addToPortfolioCart,
  readPortfolioCart,
  removeFromPortfolioCart,
  updatePortfolioCartQuantity,
  type PortfolioCartItem,
} from '@/utils/portfolio-cart';

interface PortfolioItemData {
  id: string;
  title: string;
  category: 'wedding' | 'funeral' | 'sports' | 'branding' | 'events';
  filters?: PortfolioFilters;
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
  const [activeFilters, setActiveFilters] = useState<PortfolioFilters>({});
  const [openFilter, setOpenFilter] = useState<keyof PortfolioFilters | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItemData | null>(null);
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
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
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartTax = cartSubtotal * 0.2;
  const cartTotal = cartSubtotal + cartTax;

  useEffect(() => {
    const syncCart = () => setCartItems(readPortfolioCart());
    syncCart();
    window.addEventListener('portfolio-cart-updated', syncCart);
    return () => window.removeEventListener('portfolio-cart-updated', syncCart);
  }, []);

  const categoryItems = useMemo(() => {
    if (activeFilter === 'All') return items;
    return items.filter(
      (item) => item.category.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [items, activeFilter]);

  const filterOptions = useMemo(() => {
    const groups: Record<keyof PortfolioFilters, Map<string, number>> = {
      style: new Map(), audience: new Map(), religion: new Map(), colour: new Map(), format: new Map(),
    };
    categoryItems.forEach((item) => {
      (Object.keys(groups) as (keyof PortfolioFilters)[]).forEach((group) => {
        (item.filters?.[group] ?? []).forEach((value) => {
          groups[group].set(value, (groups[group].get(value) ?? 0) + 1);
        });
      });
    });
    return groups;
  }, [categoryItems]);

  const filtered = useMemo(() => {
    return categoryItems.filter((item) =>
      (Object.keys(activeFilters) as (keyof PortfolioFilters)[]).every((group) => {
        const selected = activeFilters[group] ?? [];
        return selected.length === 0 || selected.some((value) => (item.filters?.[group] ?? []).includes(value));
      })
    );
  }, [categoryItems, activeFilters]);

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

  useEffect(() => {
    if (!selectedItem) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedItem(null);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedItem]);

  useEffect(() => {
    if (!openFilter) return;

    function handleOutsideClick(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenFilter(null);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openFilter]);

  function handleFilterChange(filter: string) {
    setActiveFilter(filter);
    setActiveFilters({});
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

  function handleFilterValueChange(group: keyof PortfolioFilters, value: string) {
    setActiveFilters((current) => {
      const values = current[group] ?? [];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [group]: nextValues };
    });
    setVisibleCount(ITEMS_PER_PAGE);
  }

  const filterLabels: Record<keyof PortfolioFilters, string> = {
    style: 'Style', audience: 'Audience', religion: 'Religion', colour: 'Colour', format: 'Format',
  };

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

      {/* Independent filter groups; values within a group are OR-matched. */}
      {Object.keys(filterOptions).some((group) => filterOptions[group as keyof PortfolioFilters].size > 0) && (
        <div className="relative z-[100] isolate mb-12 border-y border-border/60 py-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cat-heading">Refine this collection</p>
            <span className="font-mono text-[10px] text-cat-muted">{filtered.length} projects</span>
          </div>
          <div ref={filterPanelRef} className="flex flex-wrap gap-6">
            {(Object.keys(filterOptions) as (keyof PortfolioFilters)[]).map((group) => (
              filterOptions[group].size > 0 && (
                <div key={group} className="relative">
                  <button
                    type="button"
                    aria-expanded={openFilter === group}
                    aria-controls={`portfolio-filter-${group}`}
                    onClick={() => setOpenFilter(openFilter === group ? null : group)}
                    className={[
                      'group/filter flex min-h-11 items-center gap-3 border px-6 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-all duration-200',
                      openFilter === group
                        ? 'border-cat-heading bg-cat-heading text-cat-bg'
                        : 'border-border text-cat-heading hover:border-cat-accent',
                    ].join(' ')}
                  >
                    <span>{filterLabels[group]}</span>
                    {(activeFilters[group]?.length ?? 0) > 0 && (
                      <span className="opacity-70">({activeFilters[group]?.length})</span>
                    )}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className={[
                        'h-4 w-4 transition-transform duration-200',
                        openFilter === group ? 'rotate-180' : '',
                      ].join(' ')}
                    >
                      <path
                        d="m5 7.5 5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {openFilter === group && (
                    <div
                      id={`portfolio-filter-${group}`}
                      className="animate-[filter-menu-in_180ms_cubic-bezier(0.22,1,0.36,1)] absolute left-0 top-[calc(100%+8px)] z-[110] w-72 overflow-hidden rounded-xl border border-border shadow-[0_18px_40px_rgba(24,31,39,0.18)]"
                      style={{ backgroundColor: 'var(--cat-bg)', opacity: 1 }}
                      role="region"
                      aria-label={`${filterLabels[group]} filter options`}
                    >
                      <div className="max-h-80 overflow-y-auto p-2">
                        {[...filterOptions[group].keys()].sort().map((value) => (
                          <label
                            key={value}
                            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-cat-heading transition-colors hover:bg-cat-bg"
                          >
                            <input
                              type="checkbox"
                              checked={activeFilters[group]?.includes(value) ?? false}
                              onChange={() => handleFilterValueChange(group, value)}
                              className="h-4 w-4 shrink-0 accent-[var(--cat-accent)]"
                            />
                            <span>{value}</span>
                            <span className="ml-auto text-cat-muted">{filterOptions[group].get(value)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
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
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedItem(item);
                }
              }}
              data-category={item.category}
              className={[
                'group relative mb-4 break-inside-avoid overflow-hidden border border-border bg-cat-surface p-6',
                'cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cat-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-accent',
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
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/portfolio/${item.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex min-h-9 items-center gap-1 border border-cat-accent bg-cat-accent px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-cat-bg transition-all duration-200 hover:-translate-y-0.5 hover:bg-cat-accent-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-accent focus-visible:ring-offset-2"
                    >
                      View Project <span aria-hidden="true">&rarr;</span>
                    </Link>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        addToPortfolioCart({
                          id: item.id,
                          title: item.title,
                          category: item.category,
                          unitPrice: 95,
                        });
                        setCartItems(readPortfolioCart());
                        setCartOpen(true);
                      }}
                      className="inline-flex min-h-9 items-center border border-cat-heading bg-transparent px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-cat-heading transition-all duration-200 hover:-translate-y-0.5 hover:bg-cat-heading hover:text-cat-bg hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-accent focus-visible:ring-offset-2"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            </article>
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

      {selectedItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-detail-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#D9D4CC] bg-[#FDFCFA] p-6 text-[#1C2530] shadow-2xl md:p-10"
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-[#D9D4CC] font-mono text-lg text-[#1C2530] transition-colors hover:border-[#A88A40] hover:text-[#A88A40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A88A40]"
              aria-label="Close project details"
            >
              &times;
            </button>
            <div className="mb-8 aspect-[16/7] w-full border border-border/30" style={{ background: categoryGradients[selectedItem.category] }} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#6B5420]">
              {selectedItem.category}
            </span>
            <h2 id="portfolio-detail-title" className="mt-3 max-w-xl font-display text-4xl text-[#1C2530] md:text-5xl">
              {selectedItem.title}
            </h2>
            {selectedItem.description && (
              <p className="mt-5 max-w-xl font-body text-body-lg leading-relaxed text-[#374151]">
                {selectedItem.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#D9D4CC] pt-5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#5B6470]">
                {selectedItem.location || 'Worldwide'}
              </span>
              {Object.values(selectedItem.filters ?? {}).flat().map((value) => (
                <span key={value} className="border border-[#D9D4CC] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[#5B6470]">{value}</span>
              ))}
            </div>
          </article>
        </div>
      )}

      {cartOpen && (
        <div
          className="fixed inset-0 z-[210] bg-black/35"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCartOpen(false);
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-cart-title"
            className="animate-[cart-drawer-in_240ms_cubic-bezier(0.22,1,0.36,1)] absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#FDFCFA] text-[#1C2530] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#D9D4CC] px-6 py-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#6B5420]">Quote cart</p>
                <h2 id="portfolio-cart-title" className="mt-1 font-display text-3xl">Selected assets</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="flex h-11 w-11 items-center justify-center border border-[#D9D4CC] text-xl" aria-label="Close cart">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cartItems.length === 0 ? (
                <p className="font-body text-sm text-[#5B6470]">Your cart is empty.</p>
              ) : (
                <div className="space-y-5">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border-b border-[#D9D4CC] pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-xl">{item.title}</h3>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#5B6470]">{item.category}</p>
                        </div>
                        <button type="button" onClick={() => setCartItems(removeFromPortfolioCart(item.id))} className="font-mono text-[10px] uppercase tracking-wider text-[#7A4A44] underline">Remove</button>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center border border-[#D9D4CC]">
                          <button type="button" onClick={() => setCartItems(updatePortfolioCartQuantity(item.id, item.quantity - 1))} className="h-9 w-9">−</button>
                          <span className="w-9 text-center font-mono text-xs">{item.quantity}</span>
                          <button type="button" onClick={() => setCartItems(updatePortfolioCartQuantity(item.id, item.quantity + 1))} className="h-9 w-9">+</button>
                        </div>
                        <span className="font-mono text-xs">£{(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-[#D9D4CC] px-6 py-5">
                <div className="space-y-2 font-mono text-xs text-[#374151]">
                  <div className="flex justify-between"><span>Subtotal</span><span>£{cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>VAT (20%)</span><span>£{cartTax.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-[#D9D4CC] pt-3 text-base text-[#1C2530]"><span>Estimated total</span><span>£{cartTotal.toFixed(2)}</span></div>
                </div>
                <Link href="/pricing" onClick={() => setCartOpen(false)} className="mt-5 block bg-[#1C2530] px-5 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#374151]">Continue to checkout</Link>
                <button type="button" onClick={() => setCartOpen(false)} className="mt-3 w-full py-2 font-mono text-[10px] uppercase tracking-widest text-[#5B6470] underline">Continue browsing</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
