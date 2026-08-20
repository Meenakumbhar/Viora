import type { ReactNode } from 'react';

// Per-page category tinting used to key off the now-retired /services
// pages (wedding-events, funeral-memorial, etc.) — those routes are gone,
// so every page renders in the neutral "all" palette. Portfolio/product
// detail pages still set their own `data-category` locally where needed.
export default function CategoryWrapper({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" data-category="all">
      {children}
    </main>
  );
}
