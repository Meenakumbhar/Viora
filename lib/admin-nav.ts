import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/admin', exact: true },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Portfolio', href: '/admin/portfolio' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Pricing', href: '/admin/pricing' },
];
