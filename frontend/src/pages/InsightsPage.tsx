import React, { useEffect, useState, useCallback } from 'react';
import { Lightbulb, BookOpen, Target, Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useDashboardStore } from '../store/dashboard';
import { useAuthStore } from '../store/auth';
import { getInsights, generateInsights } from '../lib/api';
import { PLATFORM_CONFIG } from '../lib/constants';
import PlatformIcon from '../components/PlatformIcon';
import toast from 'react-hot-toast';

interface Insight {
  id?: string;
  type: 'insight' | 'learning' | 'recommendation';
  platform: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
}

const TYPE_CONFIG = {
  insight: { label: 'Key Insights', icon: Lightbulb, color: 'blue', bgColor: 'bg-blue-600/10', borderColor: 'border-blue-600/30', textColor: 'text-blue-400' },
  learning: { label: 'Learnings', icon: BookOpen, color: 'purple', bgColor: 'bg-purple-600/10', borderColor: 'border-purple-600/30', textColor: 'text-purple-400' },
  recommendation: { label: 'Recommendations', icon: Target, color: 'emerald', bgColor: 'bg-emerald-600/10', borderColor: 'border-emerald-600/30', textColor: 'text-emerald-400' },
};

const PRIORITY_CONFIG = {
  high: { icon: AlertTriangle, color: 'text-red-400', badge: 'bg-red-400/10 text-red-400' },
  medium: { icon: TrendingUp, color: 'text-yellow-400', badge: 'bg-yellow-400/10 text-yellow-400' },
  low: { icon: CheckCircle, color: 'text-gray-500', badge: 'bg-gray-700 text-gray-400' },
};

function InsightCard({ insight }: { insight: Insight }) {
  const typeCfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.insight;
  const priorityCfg = PRIORITY_CONFIG[insight.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeCfg.icon;
  const PriorityIcon = priorityCfg.icon;

  return (
    <div className={`p-4 rounded-xl border ${typeCfg.bgColor} ${typeCfg.borderColor} hover:border-opacity-60 transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${typeCfg.bgColor} flex-shrink-0`}>
          <TypeIcon size={16} className={typeCfg.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-200">{insight.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityCfg.badge}`}>
              {insight.priority}
            </span>
            {insight.platform && insight.platform !== 'all' && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <PlatformIcon platform={insight.platform} size={12} />
                {PLATFORM_CONFIG[insight.platform as keyof typeof PLATFORM_CONFIG]?.label || insight.platform}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>
        </div>
        <PriorityIcon size={14} className={`flex-shrink-0 ${priorityCfg.color}`} />
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const { selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const { user } = useAuthStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';

  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState('');
  const [topPlatform, setTopPlatform] = useState('');
  const [budgetRec, setBudgetRec] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const params = { client_id: clientId, start_date: startDate, end_date: endDate };

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInsights(params);
      setInsights(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clientId, startDate, endDate]);

  useEffect(() => { loadInsights(); }, [loadInsights]);

  const handleGenerate = async () => {
    setGenerating(true);
    const toastId = toast.loading('Generating AI insights...');
    try {
      const res = await generateInsights({
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
        platforms: selectedPlatforms,
      });
      const data = res.data;
      setInsights(data.insights || []);
      setSummary(data.summary || '');
      setTopPlatform(data.top_performing_platform || '');
      setBudgetRec(data.budget_recommendation || '');
      toast.success('AI insights generated!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate insights', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const filtered = activeFilter === 'all' ? insights : insights.filter((i) => i.type === activeFilter);
  const counts = {
    all: insights.length,
    insight: insights.filter((i) => i.type === 'insight').length,
    learning: insights.filter((i) => i.type === 'learning').length,
    recommendation: insights.filter((i) => i.type === 'recommendation').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-100">AI-Powered Insights</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Claude AI — analysis & recommendations for your data</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          <Sparkles size={15} />
          {generating ? 'Generating...' : 'Generate Insights'}
        </button>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="card bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Sparkles size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-300 mb-1">Executive Summary</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
              {topPlatform && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Top Performing:</span>
                  <PlatformIcon platform={topPlatform} size={14} />
                  <span className="text-xs text-blue-400 font-medium capitalize">{PLATFORM_CONFIG[topPlatform as keyof typeof PLATFORM_CONFIG]?.label || topPlatform}</span>
                </div>
              )}
              {budgetRec && (
                <div className="mt-2 p-2 bg-emerald-900/20 rounded-lg border border-emerald-700/20">
                  <p className="text-xs text-emerald-400"><span className="font-semibold">Budget Recommendation:</span> {budgetRec}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'insight', label: 'Insights' },
          { key: 'learning', label: 'Learnings' },
          { key: 'recommendation', label: 'Recommendations' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
              {counts[f.key as keyof typeof counts]}
            </span>
          </button>
        ))}
        <button onClick={loadInsights} className="ml-auto btn-secondary flex items-center gap-1.5 text-sm py-1.5">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Sparkles size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No insights yet</p>
          <p className="text-sm text-gray-600 mt-1">Click "Generate Insights" to get AI-powered analysis</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['insight', 'learning', 'recommendation'] as const).map((type) => {
            const typeInsights = filtered.filter((i) => i.type === type);
            if (!typeInsights.length) return null;
            const cfg = TYPE_CONFIG[type];
            const Icon = cfg.icon;
            return (
              <div key={type}>
                <div className={`flex items-center gap-2 mb-3 text-sm font-semibold ${cfg.textColor}`}>
                  <Icon size={16} />
                  {cfg.label} ({typeInsights.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {typeInsights.map((insight, i) => (
                    <InsightCard key={insight.id || i} insight={insight} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
