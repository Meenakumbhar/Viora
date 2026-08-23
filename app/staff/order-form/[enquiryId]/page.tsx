import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserById, getEnquiryById, getOrderFormByEnquiryId } from '@/lib/db';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import OrderFormSummary from '@/components/dashboard/OrderFormSummary';
import UserLogoutButton from '@/components/ui/UserLogoutButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Form | Studio',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Dashboard', href: '/staff', exact: true }];

export default async function StaffOrderFormPage({ params }: { params: Promise<{ enquiryId: string }> }) {
  const { enquiryId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=/staff/order-form/${enquiryId}`);

  const user = await getUserById(session.user.id);
  if (!user || !['designer', 'employee', 'proofreader', 'admin'].includes(user.role)) {
    redirect('/account');
  }

  const enquiry = await getEnquiryById(enquiryId);
  if (!enquiry) {
    notFound();
  }

  const orderForm = await getOrderFormByEnquiryId(enquiryId);

  return (
    <DashboardShell
      theme="dark"
      section="Studio"
      navItems={NAV_ITEMS}
      userLabel={user.name ? `${user.name} · ${user.role}` : user.email}
      roleLabel={user.role}
      logoutSlot={<UserLogoutButton />}
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
