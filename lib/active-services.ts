import type { ServiceCategory } from '@/types/database';

/**
 * Single on/off switch for which service lines are currently offered.
 *
 * To pause a service line, remove its category/slug below. To reactivate
 * everything, restore the full lists — every consumer (nav, portfolio,
 * services pages, quote form, sitemap) reads from here, so this is the
 * only place that needs to change.
 */
export const ACTIVE_CATEGORIES: ServiceCategory[] = ['wedding', 'funeral'];

export const ACTIVE_SERVICE_SLUGS: string[] = ['wedding-events', 'funeral-memorial'];

export function isCategoryActive(category: string): boolean {
  return (ACTIVE_CATEGORIES as string[]).includes(category);
}

export function isServiceSlugActive(slug: string): boolean {
  return ACTIVE_SERVICE_SLUGS.includes(slug);
}

// Matches how app/services/[slug]/page.tsx already maps a service slug to a
// portfolio ServiceCategory (graphic-design -> branding, print-production -> events).
export function serviceSlugToCategory(slug: string): ServiceCategory | null {
  switch (slug) {
    case 'wedding-events':
      return 'wedding';
    case 'funeral-memorial':
      return 'funeral';
    case 'sports-branding':
      return 'sports';
    case 'graphic-design':
      return 'branding';
    case 'print-production':
      return 'events';
    default:
      return null;
  }
}

// Reverse of the above, in QuoteForm's exact service-type label text — lets a
// quote raised from a portfolio item or product pre-select its service
// instead of asking the customer to pick it again.
const CATEGORY_TO_SERVICE_LABEL: Record<ServiceCategory, string> = {
  wedding: 'Wedding & Events',
  funeral: 'Funeral & Memorial',
  sports: 'Sports & Branding',
  branding: 'Graphic Design',
  events: 'Print & Production',
};

export function categoryToServiceLabel(category: string): string | null {
  return CATEGORY_TO_SERVICE_LABEL[category as ServiceCategory] ?? null;
}
