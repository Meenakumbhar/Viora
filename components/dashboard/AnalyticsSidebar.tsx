'use client';

import LineChart from '@/components/dashboard/charts/LineChart';
import VolumeBarChart from '@/components/dashboard/charts/VolumeBarChart';
import StatusBarChart from '@/components/dashboard/charts/StatusBarChart';
import { getRevenueTrend, getOrderVolumeTrend, getStatusBreakdown, getClientKpis } from '@/lib/analytics';
import type { Order } from '@/types/database';

function formatGBP(v: number): string {
  return `£${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`;
}

export default function AnalyticsSidebar({ orders }: { orders: Order[] }) {
  const revenue = getRevenueTrend(orders);
  const volume = getOrderVolumeTrend(orders);
  const statusBreakdown = getStatusBreakdown(orders);
  const kpis = getClientKpis(orders);

  return (
    <div className="space-y-10">
      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">Revenue — last 6 months</h3>
        <div className="mt-4">
          <LineChart data={revenue} formatValue={formatGBP} />
        </div>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">Order volume — last 6 months</h3>
        <div className="mt-4">
          <VolumeBarChart data={volume} />
        </div>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">Order status</h3>
        <div className="mt-4">
          <StatusBarChart data={statusBreakdown} />
        </div>
      </div>

      <div>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/40">Client KPIs</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50">Avg. order value</span>
            <span className="font-display text-lg font-light text-[#C6A85C]">{formatGBP(kpis.avgOrderValue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-white/50">Repeat customer rate</span>
            <span className="font-display text-lg font-light text-[#C6A85C]">{Math.round(kpis.repeatCustomerRate * 100)}%</span>
          </div>
          {kpis.topClient && (
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-white/50">Top client</span>
              <span className="font-mono text-[11px] text-white/70">
                {kpis.topClient.name} <span className="text-white/30">· {kpis.topClient.orderCount}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
