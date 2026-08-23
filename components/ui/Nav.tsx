'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isCategoryActive } from '@/lib/active-services';
import { groupProductsByType } from '@/lib/product-types';
import type { Product, PublicUser } from '@/types/database';
import Logo from '@/components/ui/Logo';
import AuthPopup from '@/components/ui/AuthPopup';
import { readPortfolioCart } from '@/utils/portfolio-cart';

function isNavHrefActive(href: string): boolean {
  const categoryMatch = href.match(/category=([a-z]+)/);
  if (categoryMatch) return isCategoryActive(categoryMatch[1]);
  return true;
}

// Same staff roles app/staff/page.tsx gates on — everyone else is a
// customer and belongs on /account.
const STAFF_ROLES = ['designer', 'employee', 'proofreader', 'admin'];
function accountHref(user: PublicUser): string {
  return STAFF_ROLES.includes(user.role) ? '/staff' : '/account';
}

/* ═══════════════════════════════════════════════════════════════════════════
   DROPDOWN DATA
   ═══════════════════════════════════════════════════════════════════════════ */

interface DropdownItem {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href: string;
  dropdown?: DropdownItem[];
}

function getNavLinks(products: Product[]): NavLink[] {
  const productGroups = groupProductsByType(products);
  return [
    // Dropdown items are filtered by isNavHrefActive() at render time, so
    // paused categories (see lib/active-services.ts) are hidden automatically
    // — no need to keep this list in sync by hand.
    {
      label: 'Portfolio',
      href: '/portfolio',
      dropdown: [
        // "All Work" temporarily hidden — see SHOW_ALL_FILTER in PortfolioGrid.tsx.
        { label: 'Funeral Stationery', href: '/portfolio?category=funeral' },
        { label: 'Wedding Stationery', href: '/portfolio?category=wedding' },
        { label: 'Sports', href: '/portfolio?category=sports' },
        { label: 'Branding', href: '/portfolio?category=branding' },
      ],
    },
    {
      label: 'Products',
      href: '/products',
      dropdown: productGroups.map((group) => ({ label: group.type_label, href: `/products/${group.type_slug}` })),
    },
    {
      label: 'About Us',
      href: '/about',
    },
    { label: 'Process', href: '/process' },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE LINK DATA (flat list with sub-items)
   ═══════════════════════════════════════════════════════════════════════════ */

interface MobileNavSection {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

function getMobileNav(products: Product[]): MobileNavSection[] {
  const productGroups = groupProductsByType(products);
  return [
    {
      label: 'Products',
      href: '/products',
      children: productGroups.map((group) => ({ label: group.type_label, href: `/products/${group.type_slug}` })),
    },
    {
      label: 'Portfolio',
      href: '/portfolio',
      children: [
        { label: 'Funeral Stationery', href: '/portfolio?category=funeral' },
        { label: 'Wedding Stationery', href: '/portfolio?category=wedding' },
        { label: 'Sports', href: '/portfolio?category=sports' },
        { label: 'Branding', href: '/portfolio?category=branding' },
      ],
    },
    { label: 'Process', href: '/process' },
    { label: 'About', href: '/about' },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAV COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function getHoverColorClass(href: string): string {
  const path = href.toLowerCase();
  if (path.includes('wedding') || path.includes('category=wedding')) return 'hover:text-[#C4958F]';
  if (path.includes('funeral') || path.includes('category=funeral')) return 'hover:text-[#8A6F35]';
  if (path.includes('sports') || path.includes('category=sports')) return 'hover:text-[#3D7A3A]';
  if (path.includes('branding') || path.includes('category=branding') || path.includes('design')) return 'hover:text-[#2D5FA8]';
  if (path.includes('events') || path.includes('category=events') || path.includes('production')) return 'hover:text-[#D4883A]';
  return 'hover:text-accent-gold';
}

export default function Nav({ products }: { products: Product[] }) {
  const pathname = usePathname();
  const NAV_LINKS = getNavLinks(products);
  const MOBILE_NAV = getMobileNav(products);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setAuthPopupOpen(false);
  }
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // undefined = session not checked yet, null = signed out
  const [user, setUser] = useState<PublicUser | null | undefined>(undefined);

  useEffect(() => {
    const syncCart = () => {
      setCartCount(readPortfolioCart().reduce((sum, item) => sum + item.quantity, 0));
    };
    syncCart();
    window.addEventListener('portfolio-cart-updated', syncCart);
    return () => window.removeEventListener('portfolio-cart-updated', syncCart);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setUser(json.data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  /* ── Scroll listener — track position (for the blur tint) and direction
     (to hide the bar on the way down, reveal it on the way back up) ──────── */

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);

      // Ignore the first 100px so the bar doesn't flicker while someone's
      // just nudging the page near the very top.
      if (currentScrollY <= 100) {
        setNavHidden(false);
      } else if (currentScrollY > lastScrollY) {
        setNavHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setNavHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Never hide the bar while the mobile menu (which lives inside it) is open.
  useEffect(() => {
    if (mobileOpen) setNavHidden(false);
  }, [mobileOpen]);

  /* ── Body scroll lock ────────────────────────────────────────────────── */

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /* ── Escape key closes mobile menu ───────────────────────────────────── */

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  /* ── Escape key closes the login/register popup ───────────────────────── */

  useEffect(() => {
    if (!authPopupOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAuthPopupOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [authPopupOpen]);

  /* ── Focus trap ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!mobileOpen || !mobileMenuRef.current) return;

    const menu = mobileMenuRef.current;
    const focusableSelector =
      'a[href], button, [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableElements = menu.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    // Auto-focus first element
    const firstFocusable = menu.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    return () => document.removeEventListener('keydown', handleTab);
  }, [mobileOpen]);

  /* ── Close mobile menu on route change handled during render ── */

  /* ── Dropdown handlers ───────────────────────────────────────────────── */

  const openDropdown = useCallback((label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(label);
  }, []);

  const closeDropdown = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  /* ── Active link check ───────────────────────────────────────────────── */

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-accent-gold focus:text-bg-primary focus:px-4 focus:py-2 focus:font-body focus:text-label focus:uppercase focus:tracking-wider"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-2xl transition-[transform,background-color,border-color] duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'
          } ${scrolled
            ? 'bg-bg-primary/40 border-b border-border/50'
            : 'bg-bg-primary/15 border-b border-transparent'
          }`}
      >
        <div className="container-wide h-full flex items-center justify-between">
          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Link href="/" className="flex items-center">
            <Logo
              wordmark="Memories in Prints"
              containerWidth={240}
              containerHeight={60}
              textClassName="font-display font-light text-2xl tracking-wide text-text-heading"
            />
          </Link>

          {/* ── Desktop links ────────────────────────────────────────── */}
          <div className="hidden lg:flex items-center h-full gap-4 xl:gap-8">
            <div className="flex items-stretch h-full gap-4 xl:gap-8">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.label}
                  className="relative flex items-stretch"
                  onMouseEnter={() => link.dropdown && openDropdown(link.label)}
                  onMouseLeave={() => link.dropdown && closeDropdown()}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center font-body font-normal text-label uppercase tracking-[0.12em] transition-colors duration-200 ${isActive(link.href)
                      ? 'text-accent-gold'
                      : 'text-text-heading hover:text-accent-gold'
                      }`}
                    aria-haspopup={link.dropdown ? 'true' : undefined}
                    aria-expanded={
                      link.dropdown
                        ? activeDropdown === link.label
                          ? 'true'
                          : 'false'
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>

                  {/* Dropdown */}
                  {link.dropdown && (
                    <div
                      className={`absolute top-full left-0 bg-bg-primary border border-border py-2 min-w-[220px] shadow-lg transition-all duration-200 ${activeDropdown === link.label
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                        }`}
                      role="menu"
                    >
                      {link.dropdown.filter((item) => isNavHrefActive(item.href)).map((item) => {
                        const hoverColor = getHoverColorClass(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className={`block px-5 py-3 text-body-base font-body text-text-heading hover:bg-bg-secondary border-l-2 border-transparent hover:border-current transition-all ${hoverColor}`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/pricing"
              aria-label="View quote cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-heading transition-colors hover:border-accent-gold hover:text-accent-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1" />
                <circle cx="19" cy="20" r="1" />
                <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17 7H7" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-gold px-1 text-base font-semibold text-bg-primary">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* CTA */}
            <Link
              href="/contact"
              className="rounded-2xl border border-accent-gold text-accent-gold bg-transparent px-6 py-2.5 font-body text-label uppercase tracking-wider hover:bg-accent-gold hover:text-bg-primary transition-all duration-300"
            >
              Get a Quote
            </Link>

            {/* Login / Register, or Account once signed in — rightmost element in the bar */}
            {user === undefined ? null : user ? (
              <Link
                href={accountHref(user)}
                aria-label="Your account"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-text-heading transition-colors hover:border-accent-gold hover:text-accent-gold"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" />
                </svg>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthPopupOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={authPopupOpen}
                className="rounded-2xl border border-text-heading bg-text-heading px-5 py-2.5 font-body text-label uppercase tracking-wider text-bg-primary transition-all duration-300 hover:opacity-85"
              >
                Login / Register
              </button>
            )}
          </div>

          {/* ── Hamburger ────────────────────────────────────────────── */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 z-[60]"
          >
            <span
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
                }`}
            />
            <span
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''
                }`}
            />
            <span
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
                }`}
            />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
         MOBILE OVERLAY
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        ref={mobileMenuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-0 bg-bg-primary z-50 flex flex-col items-center justify-center transition-all duration-500 lg:hidden ${mobileOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-text-heading"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Mobile links */}
        <div className="flex flex-col items-center gap-6 overflow-y-auto max-h-[80vh] px-6 py-8">
          {MOBILE_NAV.map((section, idx) => (
            <div
              key={section.label}
              className="text-center"
              style={{
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.4s ease ${idx * 0.1}s, transform 0.4s ease ${idx * 0.1}s`,
              }}
            >
              <Link
                href={section.href}
                onClick={() => setMobileOpen(false)}
                className={`font-display text-display-md transition-colors duration-200 ${isActive(section.href)
                  ? 'text-accent-gold'
                  : 'text-text-heading hover:text-accent-gold'
                  }`}
              >
                {section.label}
              </Link>

              {section.children && (
                <div className="mt-2 flex flex-col items-center gap-1">
                  {section.children.filter((child) => isNavHrefActive(child.href)).map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className={`font-body text-body-base text-text-muted transition-colors ${getHoverColorClass(child.href)}`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* CTA */}
          <div
            className="mt-4 flex flex-col items-center gap-3"
            style={{
              opacity: mobileOpen ? 1 : 0,
              transform: mobileOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.4s ease ${MOBILE_NAV.length * 0.1}s, transform 0.4s ease ${MOBILE_NAV.length * 0.1}s`,
            }}
          >
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl border border-accent-gold bg-accent-gold px-6 py-2.5 font-body text-label uppercase tracking-wider text-bg-primary transition-all duration-300 hover:bg-accent-gold-hover"
            >
              Get a Quote
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 font-body text-label uppercase tracking-wider text-text-heading hover:border-accent-gold hover:text-accent-gold"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="19" cy="20" r="1" />
                  <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17 7H7" />
                </svg>
                Cart ({cartCount})
              </Link>
              {user ? (
                <Link
                  href={accountHref(user)}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 font-body text-label uppercase tracking-wider text-text-heading hover:border-accent-gold hover:text-accent-gold"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" />
                  </svg>
                  Account
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthPopupOpen(true)}
                  aria-haspopup="dialog"
                  className="flex items-center gap-2 rounded-full border border-text-heading bg-text-heading px-4 py-2 font-body text-label uppercase tracking-wider text-bg-primary hover:opacity-85"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6" />
                  </svg>
                  Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         LOGIN / REGISTER POPUP — inline forms, no separate page navigation
         ═══════════════════════════════════════════════════════════════════ */}
      {authPopupOpen && <AuthPopup onClose={() => setAuthPopupOpen(false)} />}
    </>
  );
}
