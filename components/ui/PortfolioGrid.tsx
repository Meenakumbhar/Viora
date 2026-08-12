'use client';

import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioFilters } from '@/types/database';
import {
  addToPortfolioCart,
  readPortfolioCart,
  removeFromPortfolioCart,
  updatePortfolioCartQuantity,
  type PortfolioCartItem,
} from '@/utils/portfolio-cart';
import { isCategoryActive } from '@/lib/active-services';

interface PortfolioItemData {
  id: string;
  title: string;
  category: 'wedding' | 'funeral' | 'sports' | 'branding' | 'events';
  filters?: PortfolioFilters;
  description?: string | null;
  location?: string | null;
  image_url?: string | null;
}

interface PortfolioGridProps {
  items: PortfolioItemData[];
  showFilters?: boolean;
  onCategoryChange?: (category: string) => void;
  initialCategory?: string;
}

const ITEMS_PER_PAGE = 12;

const ALL_FILTERS = ['All', 'Wedding', 'Funeral', 'Events', 'Sports', 'Branding'] as const;
const FILTERS = ALL_FILTERS.filter((f) => f === 'All' || isCategoryActive(f.toLowerCase()));

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

const IMAGE_SIZES = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';

/* ═══════════════════════════════════════════════════════════════════════════
   VISUAL — gradient backdrop + optional real photo, graceful on-error fallback
   ═══════════════════════════════════════════════════════════════════════════ */
const PortfolioVisual = memo(function PortfolioVisual({
  title,
  category,
  imageUrl,
  className = '',
  priority = false,
  watermark = true,
  children,
}: {
  title: string;
  category: string;
  imageUrl?: string | null;
  className?: string;
  priority?: boolean;
  watermark?: boolean;
  children?: React.ReactNode;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(imageUrl ? 'loading' : 'error');
  const gradient = categoryGradients[category] || categoryGradients.branding;
  const showImage = Boolean(imageUrl) && status !== 'error';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: gradient }}>
      {watermark && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[6rem] font-bold text-cat-heading opacity-[0.06]"
        >
          {title.charAt(0).toUpperCase()}
        </span>
      )}
      {showImage && (
        <Image
          src={imageUrl as string}
          alt={title}
          fill
          priority={priority}
          sizes={IMAGE_SIZES}
          className={`object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] ${status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {children}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   CARD — memoized so opening the modal/cart never re-renders the whole grid
   ═══════════════════════════════════════════════════════════════════════════ */
const PortfolioCard = memo(function PortfolioCard({
  item,
  aspect,
  isAppearing,
  delayMs,
  priority,
  onBuy,
}: {
  item: PortfolioItemData;
  aspect: string;
  isAppearing: boolean;
  delayMs: number;
  priority: boolean;
  onBuy: (item: PortfolioItemData) => void;
}) {
  return (
    <article
      data-category={item.category}
      className={[
        'group relative mb-4 break-inside-avoid overflow-hidden border border-border bg-cat-surface',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-cat-accent hover:shadow-[0_20px_44px_rgba(24,31,39,0.12)]',
        isAppearing ? 'animate-slide-up' : '',
      ].join(' ')}
      style={isAppearing ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {/* Whole-card link to the project page — sits above everything except Buy */}
      <Link
        href={`/portfolio/${item.id}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-accent"
        aria-label={`View ${item.title}`}
      />

      {/* Visual — full-bleed photo/gradient */}
      <PortfolioVisual
        title={item.title}
        category={item.category}
        imageUrl={item.image_url}
        className={`${aspect} w-full`}
        priority={priority}
      >
        <span className="glass absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cat-heading">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cat-accent" />
          {item.category}
        </span>
      </PortfolioVisual>

      {/* Caption */}
      <div className="px-5 py-4">
        <h3 className="font-display text-xl text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-2 font-body text-sm text-cat-body line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/50 pt-3">
          <span className="font-mono text-[10px] text-cat-muted uppercase tracking-wider">
            {item.location || 'Worldwide'}
          </span>

          <button
            type="button"
            onClick={() => onBuy(item)}
            className="relative z-20 w-1/4 shrink-0 rounded-full border border-cat-accent bg-cat-accent px-3 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-cat-bg transition-all duration-200 hover:-translate-y-0.5 hover:bg-cat-accent-dark hover:shadow-[0_14px_30px_rgba(198,168,92,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-accent focus-visible:ring-offset-2"
          >
            Buy
          </button>
        </div>
      </div>
    </article>
  );
});

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
  const [cartItems, setCartItems] = useState<PortfolioCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<{ key: number; title: string } | null>(null);
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
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const syncCart = () => setCartItems(readPortfolioCart());
    syncCart();
    window.addEventListener('portfolio-cart-updated', syncCart);
    return () => window.removeEventListener('portfolio-cart-updated', syncCart);
  }, []);

  // Auto-dismiss the "added to cart" toast; restarts the timer on every new add
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const categoryItems = useMemo(() => {
    if (activeFilter === 'All') return items;
    return items.filter(
      (item) => item.category.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [items, activeFilter]);

  const filterOptions = useMemo(() => {
    const groups: Record<keyof PortfolioFilters, Map<string, number>> = {
      style: new Map(), passion: new Map(), religion: new Map(), colour: new Map(), tribute: new Map(),
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
    style: 'Style', passion: 'Passion', religion: 'Religion', colour: 'Colour', tribute: 'Tribute',
  };

  function handleLoadMore() {
    const prevCount = visibleCount;
    setVisibleCount((c) => c + ITEMS_PER_PAGE);

    // Mark new items as appearing
    const newItems = filtered.slice(prevCount, prevCount + ITEMS_PER_PAGE);
    setAppearing(new Set(newItems.map((item) => item.id)));
  }

  const handleBuyItem = useCallback((item: PortfolioItemData) => {
    addToPortfolioCart({
      id: item.id,
      title: item.title,
      category: item.category,
      unitPrice: 95,
    });
    setCartItems(readPortfolioCart());
    setToast({ key: Date.now(), title: item.title });
  }, []);

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
                'relative pb-2 font-body text-body-base uppercase tracking-wider transition-colors duration-200 cursor-pointer',
                activeFilter === filter
                  ? 'text-cat-accent font-medium'
                  : 'text-cat-muted hover:text-cat-heading',
              ].join(' ')}
            >
              {filter}
              {activeFilter === filter && (
                <motion.span
                  layoutId="portfolio-filter-underline"
                  className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-cat-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
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
                  <motion.button
                    type="button"
                    aria-expanded={openFilter === group}
                    aria-controls={`portfolio-filter-${group}`}
                    onClick={() => setOpenFilter(openFilter === group ? null : group)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={[
                      'group/filter flex min-h-11 items-center gap-3 border px-6 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition-[background-color,border-color,box-shadow] duration-200',
                      openFilter === group
                        ? 'border-cat-heading bg-cat-heading text-cat-bg shadow-[0_10px_24px_rgba(24,31,39,0.16)]'
                        : 'border-border text-cat-heading hover:border-cat-accent hover:shadow-[0_10px_24px_rgba(24,31,39,0.08)]',
                    ].join(' ')}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${(activeFilters[group]?.length ?? 0) > 0 ? 'bg-cat-accent' : 'bg-border'
                        }`}
                    />
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
                  </motion.button>

                  {openFilter === group && (
                    <div
                      id={`portfolio-filter-${group}`}
                      className="animate-[filter-menu-in_180ms_cubic-bezier(0.22,1,0.36,1)] absolute left-0 top-[calc(100%+8px)] z-[110] w-72 overflow-hidden border border-border shadow-[0_18px_40px_rgba(24,31,39,0.18)]"
                      style={{ backgroundColor: 'var(--cat-bg)', opacity: 1 }}
                      role="region"
                      aria-label={`${filterLabels[group]} filter options`}
                    >
                      <div className="max-h-80 overflow-y-auto p-2">
                        {[...filterOptions[group].keys()].sort().map((value) => (
                          <label
                            key={value}
                            className="flex min-h-12 cursor-pointer items-center gap-3 px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-cat-heading transition-colors hover:bg-cat-bg"
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
        {visible.map((item, i) => (
          <PortfolioCard
            key={item.id}
            item={item}
            aspect={aspectVariants[i % aspectVariants.length]}
            isAppearing={appearing.has(item.id)}
            delayMs={(i % ITEMS_PER_PAGE) * 80}
            priority={i < 3}
            onBuy={handleBuyItem}
          />
        ))}
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
            className="border border-accent-gold bg-transparent px-8 py-3 font-body text-label uppercase tracking-wider text-accent-gold transition-colors duration-300 hover:bg-accent-gold hover:text-bg-primary focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            Load more
          </button>
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

      {/* Persistent cart trigger — lets people reopen the drawer without another Buy click */}
      {!cartOpen && cartCount > 0 && (
        <motion.button
          type="button"
          onClick={() => setCartOpen(true)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-6 z-[190] flex items-center gap-3 border border-cat-heading bg-cat-heading px-5 py-3 text-cat-bg shadow-[0_20px_50px_rgba(24,31,39,0.25)]"
          aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17 7H7" />
          </svg>
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest">Cart</span>
          <span className="flex h-5 min-w-5 items-center justify-center bg-cat-accent px-1 font-mono text-[10px] font-semibold text-cat-heading">
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* "Added to cart" toast — confirms the add without blocking further browsing */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="fixed bottom-6 right-6 z-[220] flex max-w-sm items-center gap-4 border border-border bg-[#FDFCFA] px-5 py-4 shadow-[0_20px_50px_rgba(24,31,39,0.18)]"
          >
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center border border-cat-accent text-cat-accent">
              &check;
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cat-muted">Added to cart</p>
              <p className="mt-0.5 truncate font-display text-base text-cat-heading">{toast.title}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCartOpen(true);
                setToast(null);
              }}
              className="ml-1 shrink-0 font-mono text-[10px] font-medium uppercase tracking-wider text-cat-accent-dark transition-colors hover:text-cat-heading"
            >
              View cart &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
