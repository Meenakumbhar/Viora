import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnquiryById, getOrderFormByEnquiryId } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import OrderFormSummary from '@/components/dashboard/OrderFormSummary';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Form | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminOrderFormPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params;
  const enquiry = await getEnquiryById(enquiryId);
  if (!enquiry) {
    notFound();
  }

  const orderForm = await getOrderFormByEnquiryId(enquiryId);

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="dash-legacy">
      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Order form · read only</p>
      <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
        {enquiry.name}
      </h1>
      <p className="mt-2 font-mono text-xs text-white/30">{enquiry.email}</p>
      </div>

      <div className="mt-10">
        <OrderFormSummary enquiry={enquiry} orderForm={orderForm} />
      </div>
    </DashboardShell>
  );
}
