import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useDashboardStore } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { getAnalyticsByPlatform, getContentPerformance } from '../lib/api';
import { PLATFORM_CONFIG, formatNumber, formatPercent } from '../lib/constants';
import PlatformIcon from '../components/PlatformIcon';

export default function PlatformsPage() {
  const { selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const { user } = useAuthStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';

  const [byPlatform, setByPlatform] = useState<Record<string, unknown>[]>([]);
  const [content, setContent] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const params = { client_id: clientId, start_date: startDate, end_date: endDate, platforms: selectedPlatforms.join(',') };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plRes, ctRes] = await Promise.all([
        getAnalyticsByPlatform(params),
        getContentPerformance(params),
      ]);
      setByPlatform(plRes.data.data || []);
      setContent(ctRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, startDate, endDate, selectedPlatforms.join(',')]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = byPlatform.filter((r) => selectedPlatforms.includes(r.platform as 'instagram'));

  const maxValues: Record<string, number> = { engagement_rate: 10, impressions: 500000, reach: 300000, followers: 100000, posts: 200 };
  const radarData = ['engagement_rate', 'impressions', 'reach', 'followers', 'posts'].map((metric) => {
    const row: Record<string, string | number> = { metric: metric.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) };
    filtered.forEach((r) => {
      const max = maxValues[metric] || 100;
      row[String(r.platform)] = Math.min(100, ((r[metric] as number) / max) * 100);
    });
    return row;
  });

  const barData = filtered.map((r) => ({
    name: PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || String(r.platform),
    platform: String(r.platform),
    Impressions: r.impressions as number,
    Reach: r.reach as number,
    Engagement: r.engagement as number,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const cfg = PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG];
          const engRate = r.engagement_rate as number;
          return (
            <div key={String(r.platform)} className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5 transform translate-x-6 -translate-y-6">
                <div className="w-full h-full rounded-full" style={{ background: cfg?.color }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <PlatformIcon platform={String(r.platform)} size={32} />
                <div>
                  <div className="font-semibold text-gray-200">{cfg?.label}</div>
                  <div className={`text-xs font-medium ${engRate > 3 ? 'text-emerald-400' : engRate > 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatPercent(engRate)} Engagement Rate
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Followers', value: formatNumber(r.followers as number), color: cfg?.color },
                  { label: 'Impressions', value: formatNumber(r.impressions as number), color: '#3b82f6' },
                  { label: 'Reach', value: formatNumber(r.reach as number), color: '#8b5cf6' },
                  { label: 'Engagement', value: formatNumber(r.engagement as number), color: '#ec4899' },
                  { label: 'Likes', value: formatNumber(r.likes as number), color: '#f59e0b' },
                  { label: 'Comments', value: formatNumber(r.comments as number), color: '#10b981' },
                  { label: 'Shares', value: formatNumber(r.shares as number), color: '#06b6d4' },
                  { label: 'Clicks', value: formatNumber(r.clicks as number), color: '#f97316' },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-800/50 rounded-lg p-2.5">
                    <div className="text-xs text-gray-500 mb-0.5">{m.label}</div>
                    <div className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Platform Comparison (Radar)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 10 }} />
              {filtered.map((r) => (
                <Radar
                  key={String(r.platform)}
                  name={PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.label || String(r.platform)}
                  dataKey={String(r.platform)}
                  stroke={PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.color}
                  fill={PLATFORM_CONFIG[r.platform as keyof typeof PLATFORM_CONFIG]?.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend formatter={(v) => PLATFORM_CONFIG[v as keyof typeof PLATFORM_CONFIG]?.label || v} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Key Metrics Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 9 }} tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Impressions" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="Reach" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="Engagement" fill="#ec4899" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Content Performance</h3>
        {loading ? <div className="h-32 bg-gray-800 rounded animate-pulse" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Platform', 'Posts', 'Impressions', 'Reach', 'Engagement', 'Eng. Rate'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {content.slice(0, 20).map((row, i) => {
                  const cfg = PLATFORM_CONFIG[row.platform as keyof typeof PLATFORM_CONFIG];
                  const engRate = row.engagement_rate as number;
                  return (
                    <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-gray-400 text-xs">{String(row.date)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <PlatformIcon platform={String(row.platform)} size={14} />
                          <span className="text-gray-300 text-xs">{cfg?.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">{row.post_count as number}</td>
                      <td className="py-2.5 px-3 text-gray-400">{formatNumber(row.impressions as number)}</td>
                      <td className="py-2.5 px-3 text-gray-400">{formatNumber(row.reach as number)}</td>
                      <td className="py-2.5 px-3 text-gray-400">{formatNumber(row.engagement as number)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-medium ${engRate > 3 ? 'text-emerald-400' : engRate > 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {formatPercent(engRate)}
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
