'use client';

import { useState } from 'react';
import type { MonthPoint } from '@/lib/analytics';

interface LineChartProps {
  data: MonthPoint[];
  color?: string;
  formatValue?: (v: number) => string;
}

const WIDTH = 280;
const HEIGHT = 120;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

export default function LineChart({ data, color = '#C6A85C', formatValue = (v) => String(v) }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 1);
  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + plotH - (d.value / max) * plotH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${PAD_TOP + plotH} L ${points[0]?.x ?? 0} ${PAD_TOP + plotH} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Revenue trend line chart"
      onMouseLeave={() => setHoverIndex(null)}
    >
      {/* Gridline — baseline only, hairline */}
      <line x1={PAD_X} y1={PAD_TOP + plotH} x2={WIDTH - PAD_X} y2={PAD_TOP + plotH} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {data.every((d) => d.value === 0) ? (
        <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" className="fill-white/25" style={{ font: '10px var(--font-dm-mono, monospace)' }}>
          No revenue yet
        </text>
      ) : (
        <>
          <path d={areaPath} fill={color} opacity={0.1} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoverIndex(i)}>
              <circle cx={p.x} cy={p.y} r={4} fill={color} stroke="#0E1117" strokeWidth={2} />
              <rect x={p.x - stepX / 2} y={PAD_TOP} width={stepX || plotW} height={plotH} fill="transparent" />
            </g>
          ))}
        </>
      )}

      {/* x-axis month labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={HEIGHT - 6} textAnchor="middle" className="fill-white/30" style={{ font: '9px var(--font-dm-mono, monospace)' }}>
          {p.label}
        </text>
      ))}

      {/* end-of-line direct label */}
      {points.length > 0 && data.some((d) => d.value > 0) && (
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 8}
          textAnchor="end"
          className="fill-white/70"
          style={{ font: '10px var(--font-dm-mono, monospace)' }}
        >
          {formatValue(points[points.length - 1].value)}
        </text>
      )}

      {/* hover tooltip */}
      {hoverIndex !== null && (
        <g>
          <line x1={points[hoverIndex].x} y1={PAD_TOP} x2={points[hoverIndex].x} y2={PAD_TOP + plotH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <rect x={Math.min(points[hoverIndex].x + 6, WIDTH - 70)} y={PAD_TOP} width={64} height={18} fill="#151C24" stroke="rgba(255,255,255,0.15)" />
          <text
            x={Math.min(points[hoverIndex].x + 10, WIDTH - 66)}
            y={PAD_TOP + 12.5}
            className="fill-white/90"
            style={{ font: '10px var(--font-dm-mono, monospace)' }}
          >
            {formatValue(points[hoverIndex].value)}
          </text>
        </g>
      )}
    </svg>
  );
}
