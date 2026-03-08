import React, { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/auth';
import { useDashboardStore } from '../store/dashboard';
import { getClients, getAnalyticsByPlatform, getSpendsByPlatform, getSpendsCampaigns, getInsights } from '../lib/api';
import { exportToXLSX, exportToPDF, exportToPPT } from '../lib/export';
import Sidebar from '../components/Sidebar';
import FilterBar from '../components/FilterBar';
import OverviewPage from './OverviewPage';
import TrendsPage from './TrendsPage';
import PlatformsPage from './PlatformsPage';
import SpendsPage from './SpendsPage';
import InsightsPage from './InsightsPage';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { activeTab, selectedClient, selectedPlatforms, startDate, endDate } = useDashboardStore();
  const clientId = user?.role === 'admin' ? selectedClient : user?.client_id || '';

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load clients for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      getClients().then((res) => setClients(res.data.data || [])).catch(console.error);
    }
  }, [user]);

  // Socket.io real-time connection
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe', { clientId, platforms: selectedPlatforms });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('live-update', (data) => {
      // Show subtle update indicator
      console.log('Live update received:', data.timestamp);
    });

    return () => { socket.disconnect(); };
  }, [clientId]);

  const handleExport = useCallback(async (format: 'xlsx' | 'pdf' | 'ppt') => {
    setIsExporting(true);
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);

    try {
      const params = { client_id: clientId, start_date: startDate, end_date: endDate, platforms: selectedPlatforms.join(',') };
      const clientName = user?.role === 'admin'
        ? clients.find((c) => c.id === clientId)?.name || 'Client'
        : user?.client?.name || 'Client';

      const [platformRes, spendsRes, campaignsRes, insightsRes] = await Promise.all([
        getAnalyticsByPlatform(params),
        getSpendsByPlatform(params),
        getSpendsCampaigns(params),
        getInsights(params),
      ]);

      const exportData = {
        clientName,
        period: `${startDate} to ${endDate}`,
        overview: {},
        platformData: platformRes.data.data || [],
        spendsData: spendsRes.data.data || [],
        campaigns: campaignsRes.data.data || [],
        insights: insightsRes.data.data || [],
      };

      if (format === 'xlsx') exportToXLSX(exportData);
      else if (format === 'pdf') exportToPDF(exportData);
      else exportToPPT(exportData);

      toast.success(`${format.toUpperCase()} exported successfully!`, { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Export failed', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [clientId, startDate, endDate, selectedPlatforms, clients, user]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const renderPage = () => {
    switch (activeTab) {
      case 'overview': return <OverviewPage key={refreshKey} />;
      case 'trends': return <TrendsPage key={refreshKey} />;
      case 'platforms': return <PlatformsPage key={refreshKey} />;
      case 'spends': return <SpendsPage key={refreshKey} />;
      case 'insights': return <InsightsPage key={refreshKey} />;
      default: return <OverviewPage key={refreshKey} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#030712' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-100 capitalize">{activeTab === 'spends' ? 'Media Spends' : activeTab}</h1>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin'
                ? `Viewing: ${clients.find((c) => c.id === clientId)?.name || 'All Clients'}`
                : user?.client?.name || ''}
              {' '}&bull; {startDate} → {endDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Bell size={16} className="text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isConnected
                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                : 'text-gray-500 bg-gray-800 border-gray-700'
            }`}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Filters */}
        <FilterBar
          clients={clients}
          onExport={handleExport}
          onRefresh={handleRefresh}
          isExporting={isExporting}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
        }}
      />
    </div>
  );
}
