import type { Metadata } from 'next';
import { getAllUsers, toPublicUser } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import LogoutButton from '@/components/admin/LogoutButton';
import UsersAdminManager from '@/components/admin/UsersAdminManager';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manage Users | Admin',
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <DashboardShell
      theme="dark"
      section="Admin"
      navItems={ADMIN_NAV_ITEMS}
      userLabel="Studio team"
      logoutSlot={<LogoutButton />}
    >
      <div className="dash-legacy mb-10">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#C6A85C]">Users</span>
        <h1 className="mt-2 font-display text-4xl font-light" style={{ letterSpacing: '-0.02em' }}>
          Users &amp; Roles
        </h1>
        <p className="mt-2 font-mono text-xs text-white/30">
          Every account is a customer by default. Roles are assigned directly in the database — self-serve signup can never grant one.
        </p>
      </div>

      <UsersAdminManager initialUsers={users.map(toPublicUser)} />
    </DashboardShell>
  );
}
