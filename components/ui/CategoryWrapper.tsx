'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useLenis } from '@/lib/lenis';

export default function CategoryWrapper({ children }: { children: ReactNode }) {
  useLenis();
  const pathname = usePathname();

  let category = 'all';

  if (pathname.includes('/services/wedding-events')) {
    category = 'wedding';
  } else if (pathname.includes('/services/funeral-memorial')) {
    category = 'funeral';
  } else if (pathname.includes('/services/sports-branding')) {
    category = 'sports';
  } else if (pathname.includes('/services/graphic-design')) {
    category = 'branding';
  } else if (pathname.includes('/services/print-production')) {
    category = 'events';
  }

  return (
    <main id="main-content" data-category={category}>
      {children}
    </main>
  );
}
