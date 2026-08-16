import JobTicket from './JobTicket';
import AccountNav from './AccountNav';

interface AccountShellProps {
  userName: string;
  memberSince: string;
  logoutSlot: React.ReactNode;
  children: React.ReactNode;
}

// Shared chrome for the four account sections (Orders / Spend sheet / Saved /
// Account spec) — a plain component rather than a Next.js layout.tsx, since
// /account/orders/[id]/review lives under the same /account/* path and
// already renders its own DashboardShell; a real layout would wrap that
// page too and fetch data it doesn't need.
export default function AccountShell({ userName, memberSince, logoutSlot, children }: AccountShellProps) {
  return (
    <main id="main-content" className="min-h-screen bg-bg-primary">
      <div className="container-wide max-w-6xl pb-24 pt-32">
        <JobTicket name={userName} memberSince={memberSince} logoutSlot={logoutSlot} />

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
