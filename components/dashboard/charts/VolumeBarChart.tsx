'use client';

import { useState } from 'react';
import type { MonthPoint } from '@/lib/analytics';

const WIDTH = 280;
const HEIGHT = 120;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const BAR_MAX_WIDTH = 24;
const GAP = 2;

export default function VolumeBarChart({ data, color = '#C6A85C' }: { data: MonthPoint[]; color?: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 1);
  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = data.length > 0 ? plotW / data.length : plotW;
  const barWidth = Math.min(BAR_MAX_WIDTH, slot - GAP * 2);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Order volume by month" onMouseLeave={() => setHoverIndex(null)}>
      <line x1={PAD_X} y1={PAD_TOP + plotH} x2={WIDTH - PAD_X} y2={PAD_TOP + plotH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {data.map((d, i) => {
        const barH = (d.value / max) * plotH;
        const cx = PAD_X + i * slot + slot / 2;
        const x = cx - barWidth / 2;
        const y = PAD_TOP + plotH - barH;
        const isHover = hoverIndex === i;
        return (
          <g key={i} onMouseEnter={() => setHoverIndex(i)}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barH, 1)} rx={4} fill={color} opacity={isHover ? 1 : 0.85} />
            <rect x={cx - slot / 2} y={PAD_TOP} width={slot} height={plotH} fill="transparent" />
            <text x={cx} y={HEIGHT - 6} textAnchor="middle" className="fill-white/30" style={{ font: '9px var(--font-dm-mono, monospace)' }}>
              {d.label}
            </text>
            {isHover && (
              <text x={cx} y={y - 6} textAnchor="middle" className="fill-white/80" style={{ font: '10px var(--font-dm-mono, monospace)' }}>
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
