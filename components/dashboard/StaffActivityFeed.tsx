import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import type { StaffActivityEvent, StaffActivityEventType } from '@/types/database';

// All solid, semantic colors — legible against both the dark and light panel
// surfaces, so only the "nothing special happened" dot needs a theme swap.
const EVENT_COLOR: Record<Exclude<StaffActivityEventType, 'designer_unassigned'>, string> = {
  proof_uploaded: 'bg-[#C6A85C]',
  sent_to_customer: 'bg-[#C6A85C]',
  designer_assigned: 'bg-[#C6A85C]',
  approved: 'bg-emerald-400',
  returned_to_designer: 'bg-red-400',
  changes_requested: 'bg-red-400',
};

function eventText(event: StaffActivityEvent): string {
  const who = `${event.order_customer_name}`;
  switch (event.event_type) {
    case 'proof_uploaded':
      return `${who} — proof uploaded (${event.detail ?? ''})`;
    case 'sent_to_customer':
      return `${who} — proofreader sent ${event.detail ?? 'a proof'} to the customer`;
    case 'returned_to_designer':
      return `${who} — proofreader returned ${event.detail ?? 'a proof'}`;
    case 'changes_requested':
      return `${who} — customer requested changes (${event.detail ?? ''})`;
    case 'approved':
      return `${who} — customer approved ${event.detail ?? 'the proof'}`;
    case 'designer_assigned':
      return `${who} — assigned to ${event.detail ?? 'a designer'}`;
    case 'designer_unassigned':
      return `${who} — unassigned`;
    default:
      return who;
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function StaffActivityFeed({ events, theme }: { events: StaffActivityEvent[]; theme: DashboardTheme }) {
  const p = PANEL_THEME[theme];
  const mutedDot = theme === 'dark' ? 'bg-white/30' : 'bg-text-muted';

  if (events.length === 0) {
    return (
      <div className={`px-4 py-8 text-center font-mono text-xs ${p.faint}`}>
        Nothing yet — activity on your orders will show up here.
      </div>
    );
  }

  return (
    <ul className={`max-h-[280px] divide-y ${p.rowBorder} overflow-y-auto`}>
      {events.map((event) => (
        <li key={event.id} className="flex gap-3 px-4 py-3">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${event.event_type === 'designer_unassigned' ? mutedDot : EVENT_COLOR[event.event_type]}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className={`font-body text-[13px] leading-snug ${p.heading}`}>{eventText(event)}</p>
            <p className={`mt-0.5 font-mono text-[10px] ${p.faint}`}>{timeAgo(event.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
