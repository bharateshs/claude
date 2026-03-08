import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { Eye, Users, Heart, MousePointer, Video, FileText } from 'lucide-react';
import { useDashboardStore } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { getAnalyticsOverview, getAnalyticsTrends, getAnalyticsByPlatform } from '../lib/api';
import { PLATFORM_CONFIG, formatNumber, formatPercent } from '../lib/constants';
import MetricCard from '../components/MetricCard';
import PlatformIcon from '../components/PlatformIcon';

interface OverviewData {
  totals: Record<string, number>;
  changes: Record<string, number>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-medium">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const { selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const { user } = useAuthStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<Record<string, Record<string, unknown>[]>>({});
  const [byPlatform, setByPlatform] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const params = {
    client_id: clientId,
    start_date: startDate,
    end_date: endDate,
    platforms: selectedPlatforms.join(','),
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, trRes, plRes] = await Promise.all([
        getAnalyticsOverview(params),
        getAnalyticsTrends({ ...params, metric: 'engagement' }),
        getAnalyticsByPlatform(params),
      ]);
      setOverview(ovRes.data);
      setTrends(trRes.data.data);
      setByPlatform(plRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clientId, startDate, endDate, selectedPlatforms.join(',')]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const trendChartData = (() => {
    const dates = new Set<string>();
    Object.values(trends).forEach((rows) => rows.forEach((r) => dates.add(r.date as string)));
    return Array.from(dates).sort().map((date) => {
      const row: Record<string, string | number> = { date: format(new Date(date), 'MMM d') };
      selectedPlatforms.forEach((p) => {
        const match = trends[p]?.find((r) => r.date === date);
        row[p] = match ? (match.engagement as number) : 0;
      });
      return row;
    });
  })();

  const pieData = byPlatform.map((r) => ({
    name: PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || String(r.platform),
    value: r.engagement as number,
    color: PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.color || '#6b7280',
    platform: String(r.platform),
  }));

  const metrics = overview?.totals;
  const changes = overview?.changes;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Impressions" value={formatNumber(metrics?.total_impressions)} change={changes?.impressions} icon={<Eye size={16} />} color="#3b82f6" loading={loading} />
        <MetricCard label="Reach" value={formatNumber(metrics?.total_reach)} change={changes?.reach} icon={<Users size={16} />} color="#8b5cf6" loading={loading} />
        <MetricCard label="Engagement" value={formatNumber(metrics?.total_engagement)} change={changes?.engagement} icon={<Heart size={16} />} color="#ec4899" loading={loading} />
        <MetricCard label="Clicks" value={formatNumber(metrics?.total_clicks)} change={changes?.clicks} icon={<MousePointer size={16} />} color="#f59e0b" loading={loading} />
        <MetricCard label="Video Views" value={formatNumber(metrics?.total_video_views)} icon={<Video size={16} />} color="#ef4444" loading={loading} />
        <MetricCard label="Total Posts" value={formatNumber(metrics?.total_posts)} icon={<FileText size={16} />} color="#10b981" loading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Engagement Trends</h3>
          {loading ? (
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendChartData}>
                <defs>
                  {selectedPlatforms.map((p) => (
                    <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PLATFORM_CONFIG[p].color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PLATFORM_CONFIG[p].color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => PLATFORM_CONFIG[val as keyof typeof PLATFORM_CONFIG]?.label || val} wrapperStyle={{ fontSize: 11 }} />
                {selectedPlatforms.map((p) => (
                  <Area key={p} type="monotone" dataKey={p} name={p} stroke={PLATFORM_CONFIG[p].color} strokeWidth={2} fill={`url(#grad-${p})`} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Engagement Share</h3>
          {loading ? (
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [formatNumber(v as number), 'Engagement']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5 mt-2">
                {pieData.map((item) => {
                  const total = pieData.reduce((s, i) => s + i.value, 0);
                  const pct = total > 0 ? (item.value / total * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <PlatformIcon platform={item.platform} size={12} />
                        <span className="text-gray-400">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{formatNumber(item.value)}</span>
                        <span className="text-gray-300 font-medium w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Platform Performance Summary</h3>
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Platform', 'Followers', 'Impressions', 'Reach', 'Engagement', 'Likes', 'Comments', 'Shares', 'Clicks', 'Eng. Rate'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {byPlatform
                  .filter((r) => selectedPlatforms.includes(r.platform as 'instagram'))
                  .map((row) => {
                    const cfg = PLATFORM_CONFIG[row.platform as keyof typeof PLATFORM_CONFIG];
                    return (
                      <tr key={String(row.platform)} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <PlatformIcon platform={String(row.platform)} size={18} />
                            <span className="font-medium text-gray-200">{cfg?.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.followers as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.impressions as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.reach as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.engagement as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.likes as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.comments as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.shares as number)}</td>
                        <td className="py-3 px-3 text-gray-400">{formatNumber(row.clicks as number)}</td>
                        <td className="py-3 px-3">
                          <span className={`font-medium ${(row.engagement_rate as number) > 3 ? 'text-emerald-400' : (row.engagement_rate as number) > 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {formatPercent(row.engagement_rate as number)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
