import type { Metadata } from 'next';
import { getAllProductsForAdmin } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import ProductAdminManager from '@/components/admin/ProductAdminManager';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage Products | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const items = await getAllProductsForAdmin();

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="dash-legacy mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Products</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Products
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          Create, edit, and publish catalog products across every sector. Images upload straight to Cloudflare R2.
        </p>
      </div>

      <ProductAdminManager initialItems={items} />
    </DashboardShell>
  );
}
