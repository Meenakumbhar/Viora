import type { ServiceCategory } from '@/types/database';

// An order's service_type is free text (from the quote form, or typed by
// staff), not a fixed slug — so this is a best-effort keyword match rather
// than a lookup, mirroring the same heuristic already used to derive a
// portfolio category from a service slug elsewhere in the app.
export function serviceTypeToCategory(serviceType: string): ServiceCategory {
  const s = serviceType.toLowerCase();
  if (s.includes('wedding')) return 'wedding';
  if (s.includes('funeral') || s.includes('memorial')) return 'funeral';
  if (s.includes('sport')) return 'sports';
  if (s.includes('brand') || s.includes('design')) return 'branding';
  return 'events';
}

// Matches the [data-category="…"] --cat-accent values in globals.css exactly —
// kept as a plain lookup here since an order list mixes categories in one
// page, so the CSS custom-property swap (which is per-page, via a single
// data-category attribute) can't do this row-by-row.
export const CATEGORY_ACCENT: Record<ServiceCategory, string> = {
  wedding: '#C4958F',
  funeral: '#E5CB90',
  events: '#D4883A',
  sports: '#3D7A3A',
  branding: '#2D5FA8',
};

export function accentForServiceType(serviceType: string): string {
  return CATEGORY_ACCENT[serviceTypeToCategory(serviceType)];
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  wedding: 'Wedding',
  funeral: 'Funeral',
  events: 'Events',
  sports: 'Sports',
  branding: 'Branding',
};
