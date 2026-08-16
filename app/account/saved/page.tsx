import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById } from '@/lib/db';
import { auth } from '@/lib/auth';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import SavedItemsPanel from '@/components/dashboard/SavedItemsPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved inspiration',
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
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
      <SavedItemsPanel />
    </AccountShell>
  );
}
