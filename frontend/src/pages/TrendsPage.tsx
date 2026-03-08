import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar,
} from 'recharts';
import { format } from 'date-fns';
import { useDashboardStore } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { getAnalyticsTrends, getFollowerGrowth } from '../lib/api';
import { PLATFORM_CONFIG, METRIC_LABELS, formatNumber } from '../lib/constants';

const METRICS = ['engagement', 'impressions', 'reach', 'likes', 'comments', 'shares', 'clicks', 'video_views'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{PLATFORM_CONFIG[p.name as keyof typeof PLATFORM_CONFIG]?.label || p.name}:</span>
          <span className="text-white font-medium">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendsPage() {
  const { selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const { user } = useAuthStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [trends, setTrends] = useState<Record<string, Record<string, unknown>[]>>({});
  const [followerGrowth, setFollowerGrowth] = useState<Record<string, { date: string; followers: number }[]>>({});
  const [loading, setLoading] = useState(true);

  const params = { client_id: clientId, start_date: startDate, end_date: endDate, platforms: selectedPlatforms.join(',') };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [trRes, fgRes] = await Promise.all([
        getAnalyticsTrends({ ...params, metric: selectedMetric }),
        getFollowerGrowth(params),
      ]);
      setTrends(trRes.data.data);
      setFollowerGrowth(fgRes.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, startDate, endDate, selectedPlatforms.join(','), selectedMetric]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildChartData = (data: Record<string, Record<string, unknown>[]>, valueKey: string) => {
    const dates = new Set<string>();
    Object.values(data).forEach((rows) => rows.forEach((r) => dates.add(r.date as string)));
    return Array.from(dates).sort().map((date) => {
      const row: Record<string, string | number> = { date: format(new Date(date), 'MMM d') };
      selectedPlatforms.forEach((p) => {
        const match = data[p]?.find((r) => r.date === date);
        row[p] = match ? ((match[valueKey] as number) || 0) : 0;
      });
      return row;
    });
  };

  const trendData = buildChartData(trends, selectedMetric);
  const followerData = buildChartData(
    followerGrowth as unknown as Record<string, Record<string, unknown>[]>,
    'followers'
  );

  const weeklyData = (() => {
    if (!trendData.length) return [];
    const weeks: Record<string, Record<string, number | string>> = {};
    trendData.forEach((row, i) => {
      const week = `Week ${Math.floor(i / 7) + 1}`;
      if (!weeks[week]) weeks[week] = { date: week };
      selectedPlatforms.forEach((p) => {
        weeks[week][p] = ((weeks[week][p] as number) || 0) + ((row[p] as number) || 0);
      });
    });
    return Object.values(weeks);
  })();

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-400">Metric:</span>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMetric(m)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedMetric === m ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
              >
                {METRIC_LABELS[m] || m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily {METRIC_LABELS[selectedMetric]} Trends</h3>
        {loading ? <div className="h-72 bg-gray-800 rounded-lg animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
              {selectedPlatforms.map((p) => (
                <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_CONFIG[p].color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Weekly {METRIC_LABELS[selectedMetric]} Comparison</h3>
        {loading ? <div className="h-64 bg-gray-800 rounded-lg animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyData} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
              {selectedPlatforms.map((p) => (
                <Bar key={p} dataKey={p} fill={PLATFORM_CONFIG[p].color} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Follower Growth</h3>
        {loading ? <div className="h-64 bg-gray-800 rounded-lg animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={followerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
              {selectedPlatforms.map((p) => (
                <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_CONFIG[p].color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
