import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllOrders } from '@/lib/db';
import OrdersAdminManager from '@/components/admin/OrdersAdminManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orders | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        background: '#0E1117',
        color: '#F0EDE8',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <header
        className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md"
        style={{ background: 'rgba(14,17,23,0.9)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-mono text-xs uppercase tracking-widest text-white/30 hover:text-white/60">
              Admin
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#C6A85C]">
              Orders
            </span>
          </div>
          <Link
            href="/admin"
            className="font-mono text-xs uppercase tracking-widest text-white/40 transition-colors hover:text-white"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-light" style={{ letterSpacing: '-0.02em' }}>
            Orders
          </h1>
          <p className="mt-2 font-mono text-xs text-white/30">
            Every order placed via a quote request, tracked through to completion. Status changes email the customer.
          </p>
        </div>

        <OrdersAdminManager initialOrders={orders} />
      </div>
    </div>
  );
}
