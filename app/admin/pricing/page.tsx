import type { Metadata } from 'next';
import {
  getAllUsers,
  getAllPortfolioItemsForAdmin,
  getAllPortfolioItemPrices,
  getAllCustomerItemPrices,
  toPublicUser,
} from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import PortfolioItemPricingManager from '@/components/admin/PortfolioItemPricingManager';
import CustomerItemPricingManager from '@/components/admin/CustomerItemPricingManager';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pricing | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPricingPage() {
  const [users, portfolioItems, portfolioItemPrices, customerItemPrices] = await Promise.all([
    getAllUsers(),
    getAllPortfolioItemsForAdmin(),
    getAllPortfolioItemPrices(),
    getAllCustomerItemPrices(),
  ]);
  const publicUsers = users.map(toPublicUser);

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="dash-legacy mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Pricing</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Pricing
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          Lookup order for what a customer sees: their price for this exact piece, then the piece&apos;s shared
          baseline.
        </p>
      </div>

      <div className="space-y-14">
        <CustomerItemPricingManager initialUsers={publicUsers} initialItems={portfolioItems} initialPrices={customerItemPrices} />
        <PortfolioItemPricingManager initialItems={portfolioItems} initialPrices={portfolioItemPrices} />
      </div>
    </DashboardShell>
  );
}
