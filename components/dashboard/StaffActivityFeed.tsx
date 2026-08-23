import { PANEL_THEME, type DashboardTheme } from '@/lib/dashboard-theme';
import { timeAgo } from '@/lib/format';
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
