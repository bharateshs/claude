import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
} from 'recharts';
import { DollarSign, TrendingUp, MousePointer, Target, Percent, ArrowUpRight } from 'lucide-react';
import { useDashboardStore } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { getSpendsOverview, getSpendsByPlatform, getSpendsTrends, getSpendsCampaigns } from '../lib/api';
import { PLATFORM_CONFIG, formatNumber, formatCurrency } from '../lib/constants';
import MetricCard from '../components/MetricCard';
import PlatformIcon from '../components/PlatformIcon';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{PLATFORM_CONFIG[p.name as keyof typeof PLATFORM_CONFIG]?.label || p.name}:</span>
          <span className="text-white font-medium">${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function SpendsPage() {
  const { selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const { user } = useAuthStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';

  const [totals, setTotals] = useState<Record<string, number>>({});
  const [byPlatform, setByPlatform] = useState<Record<string, unknown>[]>([]);
  const [trends, setTrends] = useState<Record<string, { date: string; spend: number }[]>>({});
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const params = { client_id: clientId, start_date: startDate, end_date: endDate, platforms: selectedPlatforms.join(',') };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, plRes, trRes, camRes] = await Promise.all([
        getSpendsOverview(params),
        getSpendsByPlatform(params),
        getSpendsTrends(params),
        getSpendsCampaigns(params),
      ]);
      setTotals(ovRes.data.totals || {});
      setByPlatform(plRes.data.data || []);
      setTrends(trRes.data.data || {});
      setCampaigns(camRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, startDate, endDate, selectedPlatforms.join(',')]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const spendTrendData = (() => {
    const dates = new Set<string>();
    Object.values(trends).forEach((rows) => rows.forEach((r) => dates.add(r.date)));
    return Array.from(dates).sort().slice(-30).map((date) => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      selectedPlatforms.forEach((p) => {
        const match = trends[p]?.find((r) => r.date === date);
        row[p] = match ? match.spend : 0;
      });
      return row;
    });
  })();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Spend" value={formatCurrency(totals.total_spend)} icon={<DollarSign size={16} />} color="#f59e0b" loading={loading} />
        <MetricCard label="Avg. ROAS" value={`${totals.avg_roas || 0}x`} icon={<TrendingUp size={16} />} color="#10b981" loading={loading} sublabel="Return on Ad Spend" />
        <MetricCard label="Total Clicks" value={formatNumber(totals.total_clicks)} icon={<MousePointer size={16} />} color="#3b82f6" loading={loading} />
        <MetricCard label="Conversions" value={formatNumber(totals.total_conversions)} icon={<Target size={16} />} color="#8b5cf6" loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Avg. CPM" value={`$${totals.avg_cpm || 0}`} icon={<DollarSign size={16} />} color="#ec4899" loading={loading} sublabel="Cost per 1000 impressions" />
        <MetricCard label="Avg. CPC" value={`$${totals.avg_cpc || 0}`} icon={<DollarSign size={16} />} color="#f97316" loading={loading} sublabel="Cost per click" />
        <MetricCard label="Avg. CTR" value={`${totals.avg_ctr || 0}%`} icon={<Percent size={16} />} color="#06b6d4" loading={loading} sublabel="Click-through rate" />
        <MetricCard label="Impressions" value={formatNumber(totals.total_impressions)} icon={<ArrowUpRight size={16} />} color="#84cc16" loading={loading} />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Ad Spend by Platform</h3>
        {loading ? <div className="h-64 bg-gray-800 rounded-lg animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={spendTrendData} barGap={1} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
              {selectedPlatforms.map((p) => (
                <Bar key={p} dataKey={p} stackId="spend" fill={PLATFORM_CONFIG[p].color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Spend by Platform</h3>
          <div className="space-y-3">
            {byPlatform.filter((r) => selectedPlatforms.includes(r.platform as 'instagram')).map((r) => {
              const cfg = PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG];
              const totalSpend = byPlatform.reduce((s, x) => s + ((x.spend as number) || 0), 0);
              const pct = totalSpend > 0 ? ((r.spend as number) / totalSpend * 100) : 0;
              return (
                <div key={String(r.platform)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={String(r.platform)} size={16} />
                      <span className="text-sm text-gray-300">{cfg?.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">{formatCurrency(r.spend as number)}</span>
                      <span className="text-gray-600 w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg?.color }} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                    <span>ROAS: <span className="text-emerald-400">{r.avg_roas as number}x</span></span>
                    <span>CTR: <span className="text-blue-400">{r.avg_ctr as number}%</span></span>
                    <span>CPC: <span className="text-yellow-400">${r.avg_cpc as number}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Spend Trends (Last 14 Days)</h3>
          {loading ? <div className="h-64 bg-gray-800 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={spendTrendData.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
                {selectedPlatforms.map((p) => (
                  <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_CONFIG[p].color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Platform', 'Campaign', 'Spend', 'Impressions', 'Clicks', 'Conversions', 'CTR', 'CPC', 'ROAS'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {campaigns.filter((r) => selectedPlatforms.includes(r.platform as 'instagram')).map((row, i) => {
                const cfg = PLATFORM_CONFIG[row.platform as keyof typeof PLATFORM_CONFIG];
                const roas = row.avg_roas as number;
                return (
                  <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={String(row.platform)} size={16} />
                        <span className="text-gray-300 text-xs">{cfg?.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-300 font-medium">{String(row.campaign_name)}</td>
                    <td className="py-3 px-3 text-yellow-400 font-medium">{formatCurrency(row.spend as number)}</td>
                    <td className="py-3 px-3 text-gray-400">{formatNumber(row.impressions as number)}</td>
                    <td className="py-3 px-3 text-gray-400">{formatNumber(row.clicks as number)}</td>
                    <td className="py-3 px-3 text-gray-400">{formatNumber(row.conversions as number)}</td>
                    <td className="py-3 px-3 text-blue-400">{row.avg_ctr as number}%</td>
                    <td className="py-3 px-3 text-gray-400">${row.avg_cpc as number}</td>
                    <td className="py-3 px-3">
                      <span className={`font-semibold ${roas > 3 ? 'text-emerald-400' : roas > 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {roas}x
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
