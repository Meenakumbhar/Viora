import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById, toPublicUser } from '@/lib/db';
import { auth } from '@/lib/auth';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import ProfileCard from '@/components/dashboard/ProfileCard';
import SecurityCard from '@/components/dashboard/SecurityCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account spec',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
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
      <div className="max-w-lg space-y-8">
        <ProfileCard user={toPublicUser(user)} />
        <SecurityCard />
      </div>
    </AccountShell>
  );
}
