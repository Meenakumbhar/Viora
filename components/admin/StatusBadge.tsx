const STATUS_STYLES: Record<string, string> = {
  new: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  read: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  replied: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  converted: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm whitespace-nowrap ${
        STATUS_STYLES[status] ?? 'bg-white/10 text-white/50 border-white/20'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
