'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { readSavedItems } from '@/utils/portfolio-saved';

const NAV_ITEMS = [
  { href: '/account/quote', label: 'New quote', exact: true },
  { href: '/account', label: 'Orders', exact: true },
  { href: '/account/completed', label: 'Completed', exact: true },
  { href: '/account/spend', label: 'Spend sheet', exact: true },
  { href: '/account/saved', label: 'Saved', exact: true },
  { href: '/account/profile', label: 'Account spec', exact: true },
];

export default function AccountNav() {
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const sync = () => setSavedCount(readSavedItems().length);
    sync();
    window.addEventListener('portfolio-saved-updated', sync);
    return () => window.removeEventListener('portfolio-saved-updated', sync);
  }, []);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:pb-0">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors lg:border-b-0 lg:border-l-2 lg:px-4 ${
              active
                ? 'border-accent-gold text-accent-gold'
                : 'border-transparent text-text-muted hover:text-text-heading'
            }`}
          >
            {item.label}
            {item.href === '/account/saved' && savedCount > 0 && (
              <span className="ml-1.5 opacity-60">({savedCount})</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
