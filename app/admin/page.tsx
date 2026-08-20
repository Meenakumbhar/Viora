import type { Metadata } from 'next';
import Link from 'next/link';
import { getAdminDashboardData } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import StatCard from '@/components/dashboard/StatCard';
import AnalyticsSidebar from '@/components/dashboard/AnalyticsSidebar';
import LogoutButton from '@/components/admin/LogoutButton';
import StatusBadge from '@/components/admin/StatusBadge';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Memories in Prints',
  robots: { index: false, follow: false },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { enquiries, subscribers, portfolioItems, posts, orders } = await getAdminDashboardData();

  const noData = enquiries.length === 0 && subscribers.length === 0;

  // Stats
  const newEnquiries = enquiries.filter((e) => e.status === 'new').length;
  const activeSubscribers = subscribers.filter((s) => s.active).length;
  const publishedPosts = posts.filter((p) => p.published).length;
  const publishedPortfolio = portfolioItems.filter((p) => p.published).length;
  const openOrders = orders.filter((o) => o.status !== 'completed').length;

  const enquiryByStatus = {
    new: enquiries.filter((e) => e.status === 'new').length,
    read: enquiries.filter((e) => e.status === 'read').length,
    replied: enquiries.filter((e) => e.status === 'replied').length,
    converted: enquiries.filter((e) => e.status === 'converted').length,
  };

  const orderByStatus = {
    pending: orders.filter((o) => o.status === 'pending').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
      analyticsSlot={<AnalyticsSidebar orders={orders} />}
    >
      {/* ── Page title ── */}
      <div className="mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Overview</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Dashboard
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          Real-time overview of all studio activity
        </p>
      </div>

      {/* ── No data warning ── */}
      {noData && (
        <div className="mb-10 border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="font-mono text-sm text-amber-400">
            ⚠ No database connection or data found. Make sure you have:
          </p>
          <ol className="mt-2 list-decimal pl-5 font-mono text-xs text-amber-300/70 space-y-1">
            <li>Created a Neon project at <code>console.neon.tech</code></li>
            <li>Run the SQL script in your Neon SQL Editor (<code>neon_schema.sql</code>)</li>
            <li>Added <code>DATABASE_URL</code> to <code>.env.local</code></li>
            <li>Restarted the dev server after updating env variables</li>
          </ol>
        </div>
      )}

      {/* ── Stat Grid ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-12">
        <StatCard label="New Enquiries" value={newEnquiries} sub={`${enquiries.length} total`} />
        <StatCard
          label="Open Orders"
          value={openOrders}
          sub={`${orders.length} total`}
          accent="#C6A85C"
        />
        <StatCard
          label="Subscribers"
          value={activeSubscribers}
          sub={`${subscribers.length} total`}
          accent="#8B82C4"
        />
        <StatCard
          label="Portfolio Items"
          value={publishedPortfolio}
          sub={`${portfolioItems.length} total`}
          accent="#7D9B76"
        />
        <StatCard
          label="Blog Posts"
          value={publishedPosts}
          sub={`${posts.length} total`}
          accent="#2D5FA8"
        />
      </div>

      {/* ── Enquiry Status Breakdown ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">Enquiry pipeline</h2>
      </div>
      <div className="mb-10 grid grid-cols-4 gap-3">
        {(Object.entries(enquiryByStatus) as [string, number][]).map(([status, count]) => (
          <div key={status} className="border border-white/8 bg-white/3 p-4 flex items-center justify-between">
            <StatusBadge status={status} />
            <span className="font-display text-3xl text-white/70">{count}</span>
          </div>
        ))}
      </div>

      {/* ── Order Status Breakdown ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">Order fulfillment</h2>
        <Link href="/admin/orders" className="font-mono text-xs text-white/30 hover:text-[#C6A85C] transition-colors">
          Manage orders →
        </Link>
      </div>
      <div className="mb-12 grid grid-cols-3 gap-3">
        {(Object.entries(orderByStatus) as [string, number][]).map(([status, count]) => (
          <div key={status} className="border border-white/8 bg-white/3 p-4 flex items-center justify-between">
            <StatusBadge status={status} />
            <span className="font-display text-3xl text-white/70">{count}</span>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* ── Enquiries (2/3 width) — condensed; full management lives on its own tab ── */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">
              Recent Enquiries
            </h2>
            <Link href="/admin/enquiries" className="font-mono text-xs text-white/30 hover:text-[#C6A85C] transition-colors">
              Manage enquiries →
            </Link>
          </div>
          <div className="border border-white/10 overflow-hidden">
            {enquiries.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-white/30">
                No enquiries yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">
                      Item ordered
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.slice(0, 8).map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'
                        }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-body text-sm text-white/80">{e.name}</p>
                        <p className="font-mono text-[10px] text-white/30">{e.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] hidden md:table-cell">
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
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-white/30">
                          {new Date(e.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={e.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Right column: Subscribers + Content ── */}
        <div className="space-y-8">

          {/* Subscribers */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">
                Recent Subscribers
              </h2>
              <span className="font-mono text-xs text-white/30">{activeSubscribers} active</span>
            </div>
            <div className="border border-white/10">
              {subscribers.length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-white/30">
                  No subscribers yet
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {subscribers.slice(0, 10).map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                      <div>
                        <p className="font-body text-sm text-white/70">{s.email}</p>
                        <p className="font-mono text-[10px] text-white/30">
                          {new Date(s.subscribed_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                          })}
                          {s.country ? ` · ${s.country}` : ''}
                        </p>
                      </div>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-white/20'
                          }`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Content summary */}
          <div>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-white/50">
              Content
            </h2>
            <div className="border border-white/10 divide-y divide-white/5">
              {/* Portfolio by category */}
              {['wedding', 'funeral', 'sports', 'branding', 'events'].map((cat) => {
                const count = portfolioItems.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between px-4 py-3">
                    <span className="font-mono text-xs capitalize text-white/50">{cat}</span>
                    <span className="font-display text-xl text-white/40">{count}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5">
                <span className="font-mono text-xs text-white/50">Blog posts</span>
                <span className="font-display text-xl" style={{ color: '#C6A85C' }}>
                  {publishedPosts}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Recent Orders ── */}
      {orders.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-white/50">
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="font-mono text-xs text-white/30 hover:text-[#C6A85C] transition-colors">
              View all →
            </Link>
          </div>
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Customer</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Service</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Placed</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order, i) => (
                  <tr key={order.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-white/80">{order.customer_name}</p>
                      <p className="font-mono text-[10px] text-white/30">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-white/50">{order.service_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-white/30">
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recent Blog Posts ── */}
      {posts.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-white/50">
            Blog Posts
          </h2>
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Title</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Published</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40 hidden md:table-cell">Slug</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}
                  >
                    <td className="px-4 py-3 font-body text-sm text-white/70">{p.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-white/40">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] ${p.published ? 'text-emerald-400' : 'text-white/30'}`}>
                        {p.published
                          ? (p.published_at
                            ? new Date(p.published_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                            : 'Published')
                          : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="font-mono text-xs text-white/30 hover:text-[#C6A85C] transition-colors"
                      >
                        /blog/{p.slug}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-white/10 pt-8">
        <p className="font-mono text-xs text-white/20">
          Memories in Prints · Admin Dashboard · Powered by Neon PostgreSQL ·{' '}
          <span className="text-white/10">Not indexed by search engines</span>
        </p>
      </footer>
    </DashboardShell>
  );
}
