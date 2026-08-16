'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Each service page gets its own themed 3D visual — dynamically imported
// (ssr: false, since WebGL needs a browser) and keyed by slug, so Three.js
// is only ever fetched on the specific service page a visitor lands on,
// never bundled into shared/root chunks.
const VISUALS: Record<string, ComponentType> = {
  'wedding-events': dynamic(() => import('./WeddingCake3D'), { ssr: false }),
  'funeral-memorial': dynamic(() => import('./MemorialTree3D'), { ssr: false }),
  'sports-branding': dynamic(() => import('./SportsBall3D'), { ssr: false }),
  'graphic-design': dynamic(() => import('./DesignShape3D'), { ssr: false }),
};

export default function ServiceVisual({ slug }: { slug: string }) {
  const Visual = VISUALS[slug];
  if (!Visual) return null;
  return <Visual />;
}
