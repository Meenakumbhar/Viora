'use client';

import { useState } from 'react';

interface Designer {
  id: string;
  name: string | null;
  email: string;
}

interface AssignDesignerControlProps {
  orderId: string;
  currentDesignerId: string | null;
  designers: Designer[];
  onAssigned?: (designerId: string | null) => void;
}

export default function AssignDesignerControl({ orderId, currentDesignerId, designers, onAssigned }: AssignDesignerControlProps) {
  const [value, setValue] = useState(currentDesignerId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newValue: string) {
    const previous = value;
    setValue(newValue);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/staff/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designerId: newValue || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to assign.');
      }
      onAssigned?.(newValue || null);
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : 'Failed to assign.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="border border-white/20 bg-[#0E1117] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/70 outline-none focus:border-[#C6A85C] disabled:opacity-40"
        style={{ colorScheme: 'dark' }}
      >
        <option value="">— Unassigned —</option>
        {designers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name ?? d.email}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 font-mono text-[9px] text-red-400">{error}</p>}
    </div>
  );
}
