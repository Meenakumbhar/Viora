import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById, toPublicUser } from '@/lib/db';
import { auth } from '@/lib/auth';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import QuickQuoteForm from '@/components/ui/QuickQuoteForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New quote',
  robots: { index: false, follow: false },
};

interface QuotePageProps {
  searchParams: Promise<{ service?: string; details?: string; cart?: string }>;
}

export default async function AccountQuotePage({ searchParams }: QuotePageProps) {
  const { service, details, cart } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const user = await getUserById(session.user.id);
  if (!user) redirect('/login');

  return (
    <AccountShell
      userName={user.name ? user.name : 'Welcome back'}
      memberSince={new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      logoutSlot={<UserLogoutButton />}
    >
      <div className="max-w-2xl">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-text-heading">New quote</p>
        <p className="mt-1.5 font-body text-sm text-text-muted">
          Just the details for this order — we already have the rest on file.
        </p>

        <div className="mt-6">
          <QuickQuoteForm user={toPublicUser(user)} initialService={service} initialDetails={details} fromCart={cart === '1'} />
        </div>
      </div>
    </AccountShell>
  );
}
