'use client';

import { useState } from 'react';
import RegistrationBar from './RegistrationBar';
import PaymentProviderIcon from '@/components/ui/PaymentProviderIcon';
import { RAW_STATUS_LABELS, RAW_STATUS_COLORS, type RawOrderDisplayStatus } from '@/lib/order-status';
import type { PaymentProvider } from '@/types/database';

export interface MonthlySpend {
  /** Short label, e.g. "Jan" */
  label: string;
  /** Full label for the tooltip/table, e.g. "January 2026" */
  fullLabel: string;
  amount: number;
}

export interface CategorySpend {
  label: string;
  amount: number;
  color: string;
}

export interface ProviderSpend {
  provider: PaymentProvider | null;
  label: string;
  count: number;
  amount: number;
}

interface SpendSummaryProps {
  totalSpent: number;
  totalPending: number;
  avgOrderValue: number;
  byMonth: MonthlySpend[];
  byCategory: CategorySpend[];
  byProvider: ProviderSpend[];
  statusCounts: Partial<Record<RawOrderDisplayStatus, number>>;
}

const CHART_HEIGHT = 140;
const BAR_GAP = 4;
const STATUS_ORDER: RawOrderDisplayStatus[] = ['placed', 'pending', 'in_progress', 'completed'];

function formatGBP(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function SpendSummary({
  totalSpent,
  totalPending,
  avgOrderValue,
  byMonth,
  byCategory,
  byProvider,
  statusCounts,
}: SpendSummaryProps) {
  const [tableView, setTableView] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...byMonth.map((m) => m.amount), 1);
  const hasAnySpend = byMonth.some((m) => m.amount > 0);
  const totalJobs = STATUS_ORDER.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);
  const maxCategory = Math.max(...byCategory.map((c) => c.amount), 1);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-text-heading">Spend sheet</p>
        <RegistrationBar />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 border-y border-dashed border-border py-6 sm:grid-cols-3">
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Total spent</p>
          <p className="mt-1 font-display text-4xl font-light text-accent-gold" style={{ fontVariantNumeric: 'lining-nums' }}>
            {formatGBP(totalSpent)}
          </p>
        </div>
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Payment due</p>
          <p className="mt-1 font-display text-4xl font-light text-text-heading" style={{ fontVariantNumeric: 'lining-nums' }}>
            {formatGBP(totalPending)}
          </p>
        </div>
        <div>
          <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Average job</p>
          <p className="mt-1 font-display text-4xl font-light text-text-heading" style={{ fontVariantNumeric: 'lining-nums' }}>
            {formatGBP(avgOrderValue)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        {hasAnySpend && (
          <div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Spend by month</p>
              <button
                type="button"
                onClick={() => setTableView((v) => !v)}
                className="font-mono text-sm uppercase tracking-widest text-text-muted underline hover:text-accent-gold"
              >
                {tableView ? 'Chart' : 'Table'}
              </button>
            </div>

            {tableView ? (
              <table className="mt-4 w-full">
                <caption className="sr-only">Amount spent per month</caption>
                <tbody>
                  {byMonth.map((m) => (
                    <tr key={m.fullLabel} className="border-b border-border last:border-0">
                      <th scope="row" className="py-1.5 text-left font-mono text-sm font-normal uppercase tracking-wider text-text-muted">
                        {m.fullLabel}
                      </th>
                      <td className="py-1.5 text-right font-mono text-sm text-text-heading">{formatGBP(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="mt-4">
                <svg
                  viewBox={`0 0 ${byMonth.length * (100 / byMonth.length)} ${CHART_HEIGHT}`}
                  width="100%"
                  height={CHART_HEIGHT}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`Spend by month: ${byMonth.map((m) => `${m.fullLabel} ${formatGBP(m.amount)}`).join(', ')}`}
                >
                  <circle cx={1.5} cy={CHART_HEIGHT - 24} r={1.5} fill="#D44A9B" />
                  {byMonth.map((m, i) => {
                    const barWidth = 100 / byMonth.length - BAR_GAP / byMonth.length;
                    const x = i * (100 / byMonth.length);
                    const barHeight = Math.max((m.amount / max) * (CHART_HEIGHT - 24), m.amount > 0 ? 3 : 0);
                    const y = CHART_HEIGHT - 24 - barHeight;
                    const isHovered = hovered === i;
                    return (
                      <g
                        key={m.fullLabel}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <rect x={x} y={0} width={barWidth} height={CHART_HEIGHT - 24} fill="transparent" />
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={1}
                          fill="#C6A85C"
                          opacity={isHovered || hovered === null ? 1 : 0.4}
                        >
                          <title>{`${m.fullLabel}: ${formatGBP(m.amount)}`}</title>
                        </rect>
                        <text
                          x={x + barWidth / 2}
                          y={CHART_HEIGHT - 8}
                          textAnchor="middle"
                          fontSize="6"
                          className="fill-text-muted"
                          style={{ fontFamily: 'var(--font-dm-mono)' }}
                        >
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {hovered !== null && (
                  <p className="mt-2 font-mono text-sm text-text-heading">
                    {byMonth[hovered].fullLabel}: {formatGBP(byMonth[hovered].amount)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {totalJobs > 0 && (
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Jobs by stage</p>
            <div className="mt-4 flex h-2.5 w-full overflow-hidden">
              {STATUS_ORDER.filter((s) => (statusCounts[s] ?? 0) > 0).map((s) => (
                <div
                  key={s}
                  style={{ width: `${((statusCounts[s] ?? 0) / totalJobs) * 100}%`, backgroundColor: RAW_STATUS_COLORS[s] }}
                  title={`${RAW_STATUS_LABELS[s]}: ${statusCounts[s]}`}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5">
              {STATUS_ORDER.filter((s) => (statusCounts[s] ?? 0) > 0).map((s) => (
                <li key={s} className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: RAW_STATUS_COLORS[s] }} />
                  {RAW_STATUS_LABELS[s]}
                  <span className="ml-auto text-text-heading">{statusCounts[s]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {byCategory.length > 0 && (
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Spend by category</p>
            <ul className="mt-4 space-y-3">
              {byCategory.map((c) => (
                <li key={c.label}>
                  <div className="flex items-center justify-between font-mono text-sm uppercase tracking-wider">
                    <span className="text-text-heading">{c.label}</span>
                    <span className="text-text-muted">{formatGBP(c.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-border">
                    <div style={{ width: `${(c.amount / maxCategory) * 100}%`, backgroundColor: c.color }} className="h-full" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {byProvider.length > 0 && (
          <div>
            <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Payment method</p>
            <ul className="mt-4 divide-y divide-dashed divide-border">
              {byProvider.map((p) => (
                <li key={p.label} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-text-heading">
                    {p.provider && <PaymentProviderIcon provider={p.provider} />}
                    {p.label}
                  </span>
                  <span className="font-mono text-sm text-text-muted">
                    {p.count} job{p.count === 1 ? '' : 's'} · {formatGBP(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
