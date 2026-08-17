import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllEnquiries, getAllOrders } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import StatusBadge from '@/components/admin/StatusBadge';
import EnquiryOrderAction from '@/components/admin/EnquiryOrderAction';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enquiries | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminEnquiriesPage() {
  const [enquiries, orders] = await Promise.all([getAllEnquiries(), getAllOrders()]);
  const orderByEnquiryId = new Map(orders.filter((o) => o.enquiry_id).map((o) => [o.enquiry_id as string, o]));

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Enquiries</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Enquiries
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          {enquiries.length} total. Convert a quote request into an order once you&apos;re ready to start work.
        </p>
      </div>

      <div className="border border-white/10 overflow-hidden">
        {enquiries.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-white/30">No enquiries yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Name</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Item ordered</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Service</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden lg:table-cell">Country</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Date</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Status</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Order form</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Order</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-white/5 transition-colors hover:bg-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-white/80">{e.name}</p>
                      <p className="font-mono text-[10px] text-white/30">{e.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {e.portfolio_items && e.portfolio_items.length > 0 ? (
                        <p
                          className="truncate font-body text-sm text-[#C6A85C]"
                          title={e.portfolio_items.map((item) => item.title).join(', ')}
                        >
                          {e.portfolio_items.map((item) => item.title).join(', ')}
                        </p>
                      ) : (
                        <span className="font-mono text-xs text-white/25">— general enquiry —</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-white/50">{e.service_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-white/40">{e.country ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-white/30">
                        {new Date(e.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/order-form/${e.id}`} className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-[#C6A85C] transition-colors">
                        View →
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <EnquiryOrderAction enquiry={e} existingOrder={orderByEnquiryId.get(e.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
