import React from 'react'; // eslint-disable-line
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
  sublabel?: string;
  loading?: boolean;
}

export default function MetricCard({ label, value, change, icon, color = '#3b82f6', sublabel, loading }: MetricCardProps) {
  const isPositive = change != null && change > 0;
  const isNegative = change != null && change < 0;

  if (loading) {
    return (
      <div className="metric-card animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-16" />
      </div>
    );
  }

  return (
    <div className="metric-card relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
          {icon && <span className="text-gray-600">{icon}</span>}
        </div>
        <div className="text-2xl font-bold text-gray-100 mb-1">{value}</div>
        {sublabel && <div className="text-xs text-gray-500 mb-1">{sublabel}</div>}
        {change != null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-gray-500'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs prev period</span>
          </div>
        )}
      </div>
    </div>
  );
}
