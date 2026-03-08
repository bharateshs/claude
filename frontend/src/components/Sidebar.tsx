import React from 'react'; // eslint-disable-line
import { LayoutDashboard, TrendingUp, DollarSign, Lightbulb, BarChart3, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useDashboardStore } from '../store/dashboard';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'platforms', label: 'Platforms', icon: BarChart3 },
  { id: 'spends', label: 'Media Spends', icon: DollarSign },
  { id: 'insights', label: 'Insights & AI', icon: Lightbulb },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg">
            S
          </div>
          <div>
            <div className="font-bold text-white text-sm">SocialPulse</div>
            <div className="text-xs text-gray-500">Analytics Dashboard</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-200 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
          </div>
        </div>
        {user?.client && (
          <div className="mt-2 px-2 py-1 bg-blue-600/10 rounded-lg border border-blue-600/20">
            <div className="text-xs text-blue-400 font-medium">{user.client.name}</div>
            <div className="text-xs text-gray-500">{user.client.industry}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="text-xs text-gray-600 font-semibold uppercase tracking-wider px-3 mb-2">Navigation</div>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
