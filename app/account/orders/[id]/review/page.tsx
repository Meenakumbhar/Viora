import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById, getOrderById, getDesignRevisionsForCustomer } from '@/lib/db';
import { auth } from '@/lib/auth';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import DesignReviewSubmit from '@/components/ui/DesignReviewSubmit';
import type { DesignRevision } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review your design',
  robots: { index: false, follow: false },
};

const NAV_ITEMS: DashboardNavItem[] = [{ label: 'Overview', href: '/account', exact: true }];

const STATUS_LABELS: Record<DesignRevision['status'], string> = {
  pending_proofreader_review: 'In progress',
  returned_to_designer: 'In progress',
  pending_review: 'Awaiting your review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
};

export default async function ReviewDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/login?next=/account/orders/${id}/review`);
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect('/login');
  }

  const order = await getOrderById(id);
  if (!order || order.customer_email.toLowerCase() !== user.email.toLowerCase()) {
    notFound();
  }

  const revisions = await getDesignRevisionsForCustomer(id);
  const sorted = [...revisions].sort((a, b) => b.version - a.version);
  const pending = sorted.find((r) => r.status === 'pending_review');

  return (
    <DashboardShell
      theme="light"
      enableThemeToggle={false}
      section="Account"
      navItems={NAV_ITEMS}
      userLabel={user.name ?? user.email}
      logoutSlot={<UserLogoutButton />}
    >
      <span className="font-mono text-sm uppercase tracking-widest text-accent-gold">{order.service_type}</span>
      <h1 className="mt-2 font-display text-4xl font-light text-text-heading" style={{ letterSpacing: '-0.02em' }}>
        Review your design
      </h1>

      {pending ? (
        <div className="mt-10">
          <DesignReviewSubmit
            orderId={order.id}
            revisionId={pending.id}
            images={pending.image_urls}
            labels={pending.image_labels}
            version={pending.version}
            otherRevisions={sorted
              .filter((r) => r.id !== pending.id)
              .map((r) => ({ version: r.version, label: r.image_labels?.[0] ?? null, image_urls: r.image_urls }))}
          />
        </div>
      ) : (
        <p className="mt-6 font-body text-body-base text-text-muted">
          {sorted.length === 0
            ? "There's no design proof to review yet — we'll email you as soon as one is ready."
            : "You're all caught up — there's nothing awaiting your review right now."}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-2xl font-light text-text-heading">Revision history</h2>
          <ul className="mt-6 space-y-3">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center justify-between border border-border px-4 py-3">
                <span className="font-mono text-sm text-text-heading">Proof v{r.version}</span>
                <span className="font-mono text-sm uppercase tracking-widest text-text-muted">{STATUS_LABELS[r.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardShell>
  );
}
