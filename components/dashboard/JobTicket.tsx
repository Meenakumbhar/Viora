import RegistrationBar from './RegistrationBar';
import NotificationBell from './NotificationBell';

interface JobTicketProps {
  name: string;
  memberSince: string;
  logoutSlot: React.ReactNode;
}

// The dashboard's header, styled as the customer's own ticket stub — the
// same object a print job carries through the shop, cut in two: a body with
// who it's issued to, and a tear-off stub with the housekeeping details.
export default function JobTicket({ name, memberSince, logoutSlot }: JobTicketProps) {
  return (
    <div className="relative border border-border bg-bg-primary shadow-[0_1px_0_rgba(28,37,48,0.04)]">
      <div className="flex items-start justify-between px-6 py-6 sm:px-8 sm:py-7">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-text-muted">
            Memories in Prints · User Profile
          </p>
          <h1 className="mt-3 font-display text-4xl font-light text-text-heading sm:text-5xl" style={{ letterSpacing: '-0.02em' }}>
            {name}
          </h1>
        </div>
        <div className="flex shrink-0 items-start gap-4">
          <NotificationBell />
          <RegistrationBar className="mt-2.5 hidden sm:flex" />
        </div>
      </div>

      {/* Perforation — a dashed tear line with notches cut into each edge */}
      <div className="relative border-t border-dashed border-border">
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-bg-primary" aria-hidden="true" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-bg-primary" aria-hidden="true" />
      </div>

      <div className="flex items-center justify-between px-6 py-4 sm:px-8">
        <p className="font-mono text-sm uppercase tracking-widest text-text-muted">
          Member since <span className="text-text-heading">{memberSince}</span>
        </p>
        {logoutSlot}
      </div>
    </div>
  );
}
