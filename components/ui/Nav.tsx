'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

const NAV_LINKS: NavLink[] = [
  {
    label: 'Services',
    href: '/services',
    dropdown: [
      { label: 'Wedding & Events', href: '/services/wedding-events' },
      { label: 'Funeral & Memorial', href: '/services/funeral-memorial' },
      { label: 'Sports & Branding', href: '/services/sports-branding' },
      { label: 'Graphic Design', href: '/services/graphic-design' },
      { label: 'Print & Production', href: '/services/print-production' },
    ],
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    dropdown: [
      { label: 'All Work', href: '/portfolio' },
      { label: 'Wedding', href: '/portfolio?category=wedding' },
      { label: 'Funeral', href: '/portfolio?category=funeral' },
      { label: 'Sports', href: '/portfolio?category=sports' },
      { label: 'Branding', href: '/portfolio?category=branding' },
    ],
  },
  {
    label: 'About',
    href: '/about',
  },
  { label: 'Process', href: '/process' },
  { label: 'Contact', href: '/contact' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE LINK DATA (flat list with sub-items)
   ═══════════════════════════════════════════════════════════════════════════ */

interface MobileNavSection {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const MOBILE_NAV: MobileNavSection[] = [
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Wedding & Events', href: '/services/wedding-events' },
      { label: 'Funeral & Memorial', href: '/services/funeral-memorial' },
      { label: 'Sports & Branding', href: '/services/sports-branding' },
      { label: 'Graphic Design', href: '/services/graphic-design' },
      { label: 'Print & Production', href: '/services/print-production' },
    ],
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    children: [
      { label: 'Wedding', href: '/portfolio?category=wedding' },
      { label: 'Funeral', href: '/portfolio?category=funeral' },
      { label: 'Sports', href: '/portfolio?category=sports' },
      { label: 'Branding', href: '/portfolio?category=branding' },
    ],
  },
  { label: 'Process', href: '/process' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   NAV COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function getHoverColorClass(href: string): string {
  const path = href.toLowerCase();
  if (path.includes('wedding') || path.includes('category=wedding')) return 'hover:text-[#C4958F]';
  if (path.includes('funeral') || path.includes('category=funeral')) return 'hover:text-[#8B82C4]';
  if (path.includes('sports') || path.includes('category=sports')) return 'hover:text-[#3D7A3A]';
  if (path.includes('branding') || path.includes('category=branding') || path.includes('design')) return 'hover:text-[#2D5FA8]';
  if (path.includes('events') || path.includes('category=events') || path.includes('production')) return 'hover:text-[#D4883A]';
  return 'hover:text-accent-gold';
}

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  /* ── Scroll listener ──────────────────────────────────────────────────── */

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-primary/95 backdrop-blur-md border-b border-border/50'
            : 'bg-transparent'
        }`}
      >
        <div className="container-wide h-full flex items-center justify-between">
          {/* ── Logo ─────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="font-display font-light text-xl tracking-wide text-text-heading"
          >
            Memories in Prints
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
                    className={`flex items-center font-body font-normal text-label uppercase tracking-[0.12em] transition-colors duration-200 ${
                      isActive(link.href)
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
                      className={`absolute top-full left-0 bg-bg-primary border border-border py-2 min-w-[220px] shadow-lg transition-all duration-200 ${
                        activeDropdown === link.label
                          ? 'opacity-100 translate-y-0 pointer-events-auto'
                          : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}
                      role="menu"
                    >
                      {link.dropdown.map((item) => {
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
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-gold px-1 text-[10px] font-semibold text-bg-primary">
                2
              </span>
            </Link>

            {/* CTA */}
            <Link
              href="/contact"
              className="border border-accent-gold text-accent-gold bg-transparent px-6 py-2.5 font-body text-label uppercase tracking-wider hover:bg-accent-gold hover:text-bg-primary transition-all duration-300"
            >
              Get a Quote
            </Link>
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
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 origin-center ${
                mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 ${
                mobileOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-6 bg-text-heading transition-all duration-300 origin-center ${
                mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
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
        className={`fixed inset-0 bg-bg-primary z-50 flex flex-col items-center justify-center transition-all duration-500 lg:hidden ${
          mobileOpen
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
                className={`font-display text-display-md transition-colors duration-200 ${
                  isActive(section.href)
                    ? 'text-accent-gold'
                    : 'text-text-heading hover:text-accent-gold'
                }`}
              >
                {section.label}
              </Link>

              {section.children && (
                <div className="mt-2 flex flex-col items-center gap-1">
                  {section.children.map((child) => (
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
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 font-body text-label uppercase tracking-wider text-text-heading hover:border-accent-gold hover:text-accent-gold"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1" />
                <circle cx="19" cy="20" r="1" />
                <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L17 7H7" />
              </svg>
              Cart (2)
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
