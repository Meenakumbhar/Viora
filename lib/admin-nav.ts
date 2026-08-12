import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/admin', exact: true },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Portfolio', href: '/admin/portfolio' },
  { label: 'Users', href: '/admin/users' },
];
