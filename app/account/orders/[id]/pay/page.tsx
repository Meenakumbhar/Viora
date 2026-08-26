import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById, getOrderById, getDesignRevisionsForCustomer } from '@/lib/db';
import { auth } from '@/lib/auth';
import CheckoutView from '@/components/CheckoutView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false },
};

export default async function OrderPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/login?next=/account/orders/${id}/pay`);
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
  const latestRevision = [...revisions].sort((a, b) => b.version - a.version)[0];

  return <CheckoutView order={order} latestRevision={latestRevision} customerPhone={user.phone} />;
}
