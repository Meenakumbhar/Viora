const STATUS_STYLES: Record<string, string> = {
  new: 'bg-emerald-500 text-white',
  read: 'bg-blue-500 text-white',
  replied: 'bg-amber-500 text-white',
  converted: 'bg-purple-500 text-white',
  cancelled: 'bg-red-500 text-white',
  pending: 'bg-amber-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-emerald-500 text-white',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap ${
        STATUS_STYLES[status] ?? 'bg-white/20 text-white/70'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
